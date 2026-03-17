import { normalizeFunctionIdentifier } from './ffi-transport.js';
export function createGoroutinePool(transport, config) {
    const poolSize = Math.max(1, config.poolSize);
    const queue = [];
    let activeGoroutines = 0;
    let completedTasks = 0;
    let destroyed = false;
    function drainQueue() {
        while (queue.length > 0 && activeGoroutines < poolSize) {
            const task = queue.shift();
            activeGoroutines++;
            const fnId = normalizeFunctionIdentifier(task.fn) ?? '<unknown>';
            const envelope = transport.buildEnvelope(fnId, task.args);
            transport.dispatch(envelope).then((result) => {
                activeGoroutines--;
                completedTasks++;
                task.resolve(result);
                drainQueue();
            }, (err) => {
                activeGoroutines--;
                completedTasks++;
                task.reject(err);
                drainQueue();
            });
        }
    }
    const pool = {
        submit(taskId, fn, args) {
            if (destroyed) {
                return Promise.reject(new Error('GoroutinePool is destroyed'));
            }
            return new Promise((resolve, reject) => {
                queue.push({ taskId, fn, args, resolve, reject });
                drainQueue();
            });
        },
        getStats() {
            return {
                activeGoroutines,
                queuedTasks: queue.length,
                completedTasks,
            };
        },
        async drain() {
            while (queue.length > 0 || activeGoroutines > 0) {
                await new Promise((r) => setTimeout(r, 0));
            }
        },
        destroy() {
            destroyed = true;
            const err = new Error('GoroutinePool destroyed');
            for (const task of queue)
                task.reject(err);
            queue.length = 0;
            activeGoroutines = 0;
        },
    };
    return pool;
}
//# sourceMappingURL=goroutine-pool.js.map