/**
 * OBIX Go Binding
 * Backend microservices, concurrent state management
 * Connects libpolycall FFI/polyglot bridge to Go runtime
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
/**
 * FFI descriptor for Go runtime
 * Defines how Go interops with libpolycall
 */
export interface GoFFIDescriptor {
    ffiPath: string;
    goVersion: string;
    cgoEnabled: boolean;
    concurrencyModel: 'goroutines' | 'channels' | 'sync';
    goroutinePoolSize: number;
}
/**
 * Configuration for Go binding
 * Specifies how libpolycall connects to Go runtime
 */
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
/**
 * Bridge interface for Go runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface GoBindingBridge {
    /**
     * Initialize the binding and connect to libpolycall
     */
    initialize(): Promise<void>;
    /**
     * Invoke a polyglot function through libpolycall
     * @param fn Function name or descriptor
     * @param args Arguments to pass to function
     * @returns Result from polyglot function
     */
    invoke(fn: string | object, args: unknown[]): Promise<unknown>;
    /**
     * Clean up resources and disconnect from libpolycall
     */
    destroy(): Promise<void>;
    /**
     * Get current memory usage of the binding
     * @returns Memory usage statistics
     */
    getMemoryUsage(): {
        allocBytes: number;
        totalAllocBytes: number;
        sysBytes: number;
        numGC: number;
        goroutineCount: number;
    };
    /**
     * Get schema mode of current binding
     */
    getSchemaMode(): SchemaMode;
    /**
     * Check if binding is initialized and ready
     */
    isInitialized(): boolean;
    /**
     * Execute a goroutine pool task
     */
    submitTask(taskId: string, fn: string | object, args: unknown[]): Promise<unknown>;
    /**
     * Get goroutine pool statistics
     */
    getPoolStats(): {
        activeGoroutines: number;
        queuedTasks: number;
        completedTasks: number;
    };
}
/**
 * Create a Go binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export declare function createGoBinding(config: GoBindingConfig): GoBindingBridge;
//# sourceMappingURL=index.d.ts.map