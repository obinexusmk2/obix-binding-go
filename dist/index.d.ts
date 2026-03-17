/**
 * OBIX Go Binding
 * Backend microservices, concurrent state management
 * Connects libpolycall FFI/polyglot bridge to Go runtime
 */
export type { SchemaMode, InvocationEnvelope, BindingInvokeError, BindingAbiInvoker, GoFFIDescriptor, GoBindingConfig, GoBindingBridge, GoMemoryStats, PoolStats, PoolTask, GoroutinePoolConfig, GoroutinePoolAPI, ChannelConfig, GoChannel, ChannelManagerAPI, MemoryTrackerConfig, MemoryTrackerAPI, ResolvedSchema, SchemaResolverConfig, SchemaResolverAPI, FFITransportConfig, FFITransportAPI, } from './types.js';
export { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
export { createGoroutinePool } from './goroutine-pool.js';
export { createChannelManager } from './channel-manager.js';
export { createMemoryTracker } from './memory-tracker.js';
export { createSchemaResolver } from './schema-resolver.js';
import type { GoBindingBridge, GoBindingConfig } from './types.js';
/**
 * Create a Go binding to libpolycall
 * @param config Configuration for the binding
 * @returns Bridge for invoking polyglot functions and managing Go runtime state
 */
export declare function createGoBinding(config: GoBindingConfig): GoBindingBridge;
//# sourceMappingURL=index.d.ts.map