import type {
  FFITransportAPI,
  GoroutinePoolAPI,
  GoroutinePoolConfig,
  PoolStats,
  PoolTask,
} from './types.js';

import { normalizeFunctionIdentifier } from './ffi-transport.js';

export function createGoroutinePool(
  transport: FFITransportAPI,
  config: GoroutinePoolConfig,
): GoroutinePoolAPI {
  const poolSize = Math.max(1, config.poolSize);
  const queue: PoolTask[] = [];
  let activeGoroutines = 0;
  let completedTasks = 0;
  let destroyed = false;

  function drainQueue(): void {
    while (queue.length > 0 && activeGoroutines < poolSize) {
      const task = queue.shift()!;
      activeGoroutines++;

      const fnId = normalizeFunctionIdentifier(task.fn) ?? '<unknown>';
      const envelope = transport.buildEnvelope(fnId, task.args);

      transport.dispatch(envelope).then(
        (result) => {
          activeGoroutines--;
          completedTasks++;
          task.resolve(result);
          drainQueue();
        },
        (err) => {
          activeGoroutines--;
          completedTasks++;
          task.reject(err);
          drainQueue();
        },
      );
    }
  }

  const pool: GoroutinePoolAPI = {
    submit(taskId: string, fn: string | object, args: unknown[]): Promise<unknown> {
      if (destroyed) {
        return Promise.reject(new Error('GoroutinePool is destroyed'));
      }
      return new Promise<unknown>((resolve, reject) => {
        queue.push({ taskId, fn, args, resolve, reject });
        drainQueue();
      });
    },

    getStats(): PoolStats {
      return {
        activeGoroutines,
        queuedTasks: queue.length,
        completedTasks,
      };
    },

    async drain(): Promise<void> {
      while (queue.length > 0 || activeGoroutines > 0) {
        await new Promise<void>((r) => setTimeout(r, 0));
      }
    },

    destroy(): void {
      destroyed = true;
      const err = new Error('GoroutinePool destroyed');
      for (const task of queue) task.reject(err);
      queue.length = 0;
      activeGoroutines = 0;
    },
  };

  return pool;
}
