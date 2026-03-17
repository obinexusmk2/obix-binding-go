import type { GoMemoryStats, MemoryTrackerAPI, MemoryTrackerConfig } from './types.js';

export function createMemoryTracker(config: MemoryTrackerConfig = {}): MemoryTrackerAPI {
  // gcFraction mirrors GOGC: percentage of heap growth that triggers a GC cycle.
  // Retained for future integration with a real Go runtime bridge.
  const _gcFraction = config.gcFraction ?? 100;
  void _gcFraction;

  let allocBytes = 0;
  let totalAllocBytes = 0;
  let sysBytes = 0;
  let numGC = 0;
  let goroutineCount = 0;

  const tracker: MemoryTrackerAPI = {
    snapshot(): GoMemoryStats {
      return { allocBytes, totalAllocBytes, sysBytes, numGC, goroutineCount };
    },

    recordAlloc(bytes: number): void {
      allocBytes += bytes;
      totalAllocBytes += bytes;
      sysBytes = Math.ceil(allocBytes * 1.5);
    },

    recordGC(): void {
      numGC++;
      // Simulate GC reclaiming ~30% of live heap
      allocBytes = Math.ceil(allocBytes * 0.7);
      sysBytes = Math.ceil(allocBytes * 1.5);
    },

    setGoroutineCount(count: number): void {
      goroutineCount = Math.max(0, count);
    },

    reset(): void {
      allocBytes = 0;
      totalAllocBytes = 0;
      sysBytes = 0;
      numGC = 0;
      goroutineCount = 0;
    },

    destroy(): void {
      tracker.reset();
    },
  };

  return tracker;
}
