import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGoroutinePool } from '../src/goroutine-pool';
import type { FFITransportAPI, InvocationEnvelope } from '../src/types';

function makeMockTransport(resolveWith: unknown = { ok: true }): FFITransportAPI {
  return {
    buildEnvelope: (functionId: string, args: unknown[]): InvocationEnvelope => ({
      functionId,
      args,
      metadata: { schemaMode: 'hybrid', binding: 'go', timestampMs: 0, ffiPath: '/mock' },
    }),
    dispatch: vi.fn().mockResolvedValue(resolveWith),
    destroy: vi.fn(),
  };
}

describe('createGoroutinePool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getStats returns zero counts initially', () => {
    const pool = createGoroutinePool(makeMockTransport(), { poolSize: 4, concurrencyModel: 'goroutines' });
    expect(pool.getStats()).toEqual({ activeGoroutines: 0, queuedTasks: 0, completedTasks: 0 });
  });

  it('submit dispatches a task through the transport', async () => {
    const transport = makeMockTransport({ ok: true });
    const pool = createGoroutinePool(transport, { poolSize: 4, concurrencyModel: 'goroutines' });
    const result = await pool.submit('t1', 'doSomething', [1, 2]);
    expect(result).toEqual({ ok: true });
    expect(transport.dispatch).toHaveBeenCalledTimes(1);
  });

  it('completedTasks increments after each resolution', async () => {
    const pool = createGoroutinePool(makeMockTransport(), { poolSize: 4, concurrencyModel: 'goroutines' });
    await pool.submit('t1', 'fn', []);
    await pool.submit('t2', 'fn', []);
    expect(pool.getStats().completedTasks).toBe(2);
  });

  it('respects poolSize concurrency bound', async () => {
    let releaseFn!: () => void;
    const slowTransport: FFITransportAPI = {
      buildEnvelope: (id, args) => ({ functionId: id, args, metadata: { schemaMode: 'hybrid', binding: 'go', timestampMs: 0, ffiPath: '/mock' } }),
      dispatch: vi.fn().mockImplementation(() => new Promise<unknown>((r) => { releaseFn = () => r({ ok: true }); })),
      destroy: vi.fn(),
    };

    const pool = createGoroutinePool(slowTransport, { poolSize: 1, concurrencyModel: 'goroutines' });

    // Submit 3 tasks; pool can only run 1 at a time
    const p1 = pool.submit('t1', 'fn', []);
    const p2 = pool.submit('t2', 'fn', []);
    const p3 = pool.submit('t3', 'fn', []);

    // Allow first task to be scheduled
    await Promise.resolve();
    expect(pool.getStats().activeGoroutines).toBe(1);
    expect(pool.getStats().queuedTasks).toBe(2);

    // Drain all
    releaseFn();
    await p1;
    releaseFn();
    await p2;
    releaseFn();
    await p3;

    expect(pool.getStats().completedTasks).toBe(3);
    expect(pool.getStats().queuedTasks).toBe(0);
  });

  it('submit rejects after destroy', async () => {
    const pool = createGoroutinePool(makeMockTransport(), { poolSize: 2, concurrencyModel: 'goroutines' });
    pool.destroy();
    await expect(pool.submit('t', 'fn', [])).rejects.toThrow('destroyed');
  });

  it('destroy rejects all queued tasks', async () => {
    let releaseFn!: () => void;
    const blockingTransport: FFITransportAPI = {
      buildEnvelope: (id, args) => ({ functionId: id, args, metadata: { schemaMode: 'hybrid', binding: 'go', timestampMs: 0, ffiPath: '/mock' } }),
      dispatch: vi.fn().mockImplementation(() => new Promise<unknown>((r) => { releaseFn = () => r({ ok: true }); })),
      destroy: vi.fn(),
    };

    const pool = createGoroutinePool(blockingTransport, { poolSize: 1, concurrencyModel: 'goroutines' });

    const p1 = pool.submit('t1', 'fn', []);
    const p2 = pool.submit('t2', 'fn', []);

    // Allow first task to start running
    await Promise.resolve();

    // Destroy should reject queued task
    pool.destroy();

    await expect(p2).rejects.toThrow('destroyed');

    // Release the in-flight task so the test doesn't hang
    releaseFn();
    await p1.catch(() => {});
  });

  it('drain resolves once all tasks complete', async () => {
    const pool = createGoroutinePool(makeMockTransport(), { poolSize: 2, concurrencyModel: 'goroutines' });
    pool.submit('t1', 'fn', []);
    pool.submit('t2', 'fn', []);
    await pool.drain();
    const stats = pool.getStats();
    expect(stats.queuedTasks).toBe(0);
    expect(stats.activeGoroutines).toBe(0);
    expect(stats.completedTasks).toBe(2);
  });
});
