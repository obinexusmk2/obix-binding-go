/**
 * OBIX Go Binding — shared types
 */
export type SchemaMode = 'monoglot' | 'polyglot' | 'hybrid';
export interface InvocationEnvelope {
    functionId: string;
    args: unknown[];
    metadata: {
        schemaMode: SchemaMode;
        binding: string;
        timestampMs: number;
        ffiPath: string;
    };
}
export interface BindingInvokeError {
    code: 'NOT_INITIALIZED' | 'MISSING_SYMBOL' | 'INVOCATION_FAILED';
    message: string;
    envelope: InvocationEnvelope;
    cause?: unknown;
}
export interface BindingAbiInvoker {
    invoke(envelopeJson: string): unknown | Promise<unknown>;
}
export interface GoFFIDescriptor {
    ffiPath: string;
    goVersion: string;
    cgoEnabled: boolean;
    concurrencyModel: 'goroutines' | 'channels' | 'sync';
    goroutinePoolSize: number;
}
export interface GoBindingConfig {
    ffiPath: string;
    goPath: string;
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    cgoEnabled?: boolean;
    goroutinePoolSize?: number;
    concurrencyModel?: 'goroutines' | 'channels' | 'sync';
    channelBufferSize?: number;
    gcFraction?: number;
    ffiDescriptor?: GoFFIDescriptor;
}
export interface FFITransportConfig {
    ffiPath: string;
    schemaMode: SchemaMode;
    bindingName: string;
}
export interface FFITransportAPI {
    buildEnvelope(functionId: string, args: unknown[]): InvocationEnvelope;
    dispatch(envelope: InvocationEnvelope): Promise<unknown>;
    destroy(): void;
}
export interface GoroutinePoolConfig {
    poolSize: number;
    concurrencyModel: 'goroutines' | 'channels' | 'sync';
}
export interface PoolTask {
    taskId: string;
    fn: string | object;
    args: unknown[];
    resolve(result: unknown): void;
    reject(error: unknown): void;
}
export interface PoolStats {
    activeGoroutines: number;
    queuedTasks: number;
    completedTasks: number;
}
export interface GoroutinePoolAPI {
    submit(taskId: string, fn: string | object, args: unknown[]): Promise<unknown>;
    getStats(): PoolStats;
    drain(): Promise<void>;
    destroy(): void;
}
export interface ChannelConfig {
    bufferSize: number;
}
export interface GoChannel<T = unknown> {
    readonly name: string;
    readonly bufferSize: number;
    readonly length: number;
    readonly closed: boolean;
    /** Returns false when buffer is full; throws when channel is closed. */
    send(value: T): boolean;
    receive(): T | undefined;
    close(): void;
}
export interface ChannelManagerAPI {
    create<T = unknown>(name: string, bufferSize?: number): GoChannel<T>;
    get<T = unknown>(name: string): GoChannel<T> | undefined;
    delete(name: string): void;
    listNames(): string[];
    destroy(): void;
}
export interface GoMemoryStats {
    allocBytes: number;
    totalAllocBytes: number;
    sysBytes: number;
    numGC: number;
    goroutineCount: number;
}
export interface MemoryTrackerConfig {
    gcFraction?: number;
    sampleIntervalMs?: number;
}
export interface MemoryTrackerAPI {
    snapshot(): GoMemoryStats;
    recordAlloc(bytes: number): void;
    recordGC(): void;
    setGoroutineCount(count: number): void;
    reset(): void;
    destroy(): void;
}
export interface SchemaResolverConfig {
    schemaMode: SchemaMode;
    goVersion?: string;
}
export interface ResolvedSchema {
    mode: SchemaMode;
    version: string;
    supportsMultiLanguage: boolean;
    requiresCGO: boolean;
}
export interface SchemaResolverAPI {
    resolve(): ResolvedSchema;
    validate(mode: SchemaMode): boolean;
    getMode(): SchemaMode;
    destroy(): void;
}
export interface GoBindingBridge {
    initialize(): Promise<void>;
    invoke(fn: string | object, args: unknown[]): Promise<unknown>;
    destroy(): Promise<void>;
    getMemoryUsage(): GoMemoryStats;
    getSchemaMode(): SchemaMode;
    isInitialized(): boolean;
    submitTask(taskId: string, fn: string | object, args: unknown[]): Promise<unknown>;
    getPoolStats(): PoolStats;
    readonly ffiTransport: FFITransportAPI;
    readonly goroutinePool: GoroutinePoolAPI;
    readonly channelManager: ChannelManagerAPI;
    readonly memoryTracker: MemoryTrackerAPI;
    readonly schemaResolver: SchemaResolverAPI;
}
//# sourceMappingURL=types.d.ts.map