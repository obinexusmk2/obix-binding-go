export function createMemoryTracker(config = {}) {
    // gcFraction mirrors GOGC: percentage of heap growth that triggers a GC cycle.
    // Retained for future integration with a real Go runtime bridge.
    const _gcFraction = config.gcFraction ?? 100;
    void _gcFraction;
    let allocBytes = 0;
    let totalAllocBytes = 0;
    let sysBytes = 0;
    let numGC = 0;
    let goroutineCount = 0;
    const tracker = {
        snapshot() {
            return { allocBytes, totalAllocBytes, sysBytes, numGC, goroutineCount };
        },
        recordAlloc(bytes) {
            allocBytes += bytes;
            totalAllocBytes += bytes;
            sysBytes = Math.ceil(allocBytes * 1.5);
        },
        recordGC() {
            numGC++;
            // Simulate GC reclaiming ~30% of live heap
            allocBytes = Math.ceil(allocBytes * 0.7);
            sysBytes = Math.ceil(allocBytes * 1.5);
        },
        setGoroutineCount(count) {
            goroutineCount = Math.max(0, count);
        },
        reset() {
            allocBytes = 0;
            totalAllocBytes = 0;
            sysBytes = 0;
            numGC = 0;
            goroutineCount = 0;
        },
        destroy() {
            tracker.reset();
        },
    };
    return tracker;
}
//# sourceMappingURL=memory-tracker.js.map