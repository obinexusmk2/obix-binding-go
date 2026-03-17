import { describe, expect, it } from 'vitest';
import { createMemoryTracker } from '../src/memory-tracker';

describe('createMemoryTracker', () => {
  it('snapshot returns zero stats initially', () => {
    const tracker = createMemoryTracker();
    expect(tracker.snapshot()).toEqual({
      allocBytes: 0,
      totalAllocBytes: 0,
      sysBytes: 0,
      numGC: 0,
      goroutineCount: 0,
    });
  });

  it('recordAlloc accumulates allocBytes and totalAllocBytes', () => {
    const tracker = createMemoryTracker();
    tracker.recordAlloc(1000);
    expect(tracker.snapshot().allocBytes).toBe(1000);
    expect(tracker.snapshot().totalAllocBytes).toBe(1000);

    tracker.recordAlloc(500);
    expect(tracker.snapshot().allocBytes).toBe(1500);
    expect(tracker.snapshot().totalAllocBytes).toBe(1500);
  });

  it('recordAlloc sets sysBytes to ~1.5x allocBytes', () => {
    const tracker = createMemoryTracker();
    tracker.recordAlloc(1000);
    expect(tracker.snapshot().sysBytes).toBe(1500);
  });

  it('recordGC increments numGC and reduces allocBytes', () => {
    const tracker = createMemoryTracker();
    tracker.recordAlloc(1000);
    tracker.recordGC();
    expect(tracker.snapshot().numGC).toBe(1);
    expect(tracker.snapshot().allocBytes).toBeLessThan(1000);
  });

  it('totalAllocBytes never decreases after recordGC', () => {
    const tracker = createMemoryTracker();
    tracker.recordAlloc(1000);
    tracker.recordGC();
    expect(tracker.snapshot().totalAllocBytes).toBe(1000);
  });

  it('multiple GC cycles keep decrementing allocBytes', () => {
    const tracker = createMemoryTracker();
    tracker.recordAlloc(10000);
    tracker.recordGC();
    tracker.recordGC();
    expect(tracker.snapshot().numGC).toBe(2);
    expect(tracker.snapshot().allocBytes).toBeLessThan(7000);
  });

  it('setGoroutineCount updates goroutineCount', () => {
    const tracker = createMemoryTracker();
    tracker.setGoroutineCount(8);
    expect(tracker.snapshot().goroutineCount).toBe(8);
  });

  it('setGoroutineCount clamps negative values to 0', () => {
    const tracker = createMemoryTracker();
    tracker.setGoroutineCount(-5);
    expect(tracker.snapshot().goroutineCount).toBe(0);
  });

  it('reset zeroes all fields', () => {
    const tracker = createMemoryTracker();
    tracker.recordAlloc(9999);
    tracker.recordGC();
    tracker.setGoroutineCount(5);
    tracker.reset();
    expect(tracker.snapshot()).toEqual({
      allocBytes: 0,
      totalAllocBytes: 0,
      sysBytes: 0,
      numGC: 0,
      goroutineCount: 0,
    });
  });

  it('destroy calls reset', () => {
    const tracker = createMemoryTracker();
    tracker.recordAlloc(500);
    tracker.destroy();
    expect(tracker.snapshot()).toEqual({
      allocBytes: 0,
      totalAllocBytes: 0,
      sysBytes: 0,
      numGC: 0,
      goroutineCount: 0,
    });
  });
});
