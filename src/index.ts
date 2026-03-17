/**
 * OBIX Go Binding
 * Backend microservices, concurrent state management
 * Connects libpolycall FFI/polyglot bridge to Go runtime
 */

// ── Type re-exports ────────────────────────────────────────────────────────────
export type {
  SchemaMode,
  InvocationEnvelope,
  BindingInvokeError,
  BindingAbiInvoker,
  GoFFIDescriptor,
  GoBindingConfig,
  GoBindingBridge,
  GoMemoryStats,
  PoolStats,
  PoolTask,
  GoroutinePoolConfig,
  GoroutinePoolAPI,
  ChannelConfig,
  GoChannel,
  ChannelManagerAPI,
  MemoryTrackerConfig,
  MemoryTrackerAPI,
  ResolvedSchema,
  SchemaResolverConfig,
  SchemaResolverAPI,
  FFITransportConfig,
  FFITransportAPI,
} from './types.js';

// ── Sub-module factory re-exports ─────────────────────────────────────────────
export { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
export { createGoroutinePool } from './goroutine-pool.js';
export { createChannelManager } from './channel-manager.js';
export { createMemoryTracker } from './memory-tracker.js';
export { createSchemaResolver } from './schema-resolver.js';

// ── Imports for the main factory ──────────────────────────────────────────────
import type { GoBindingBridge, GoBindingConfig, GoMemoryStats, PoolStats } from './types.js';
import { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
import { createGoroutinePool } from './goroutine-pool.js';
import { createChannelManager } from './channel-manager.js';
import { createMemoryTracker } from './memory-tracker.js';
import { createSchemaResolver } from './schema-resolver.js';

// ── Main factory ──────────────────────────────────────────────────────────────

/**
 * Create a Go binding to libpolycall
 * @param config Configuration for the binding
 * @returns Bridge for invoking polyglot functions and managing Go runtime state
 */
export function createGoBinding(config: GoBindingConfig): GoBindingBridge {
  let initialized = false;
  const ABI_BINDING_NAME = 'go';

  const ffiTransport = createFFITransport({
    ffiPath: config.ffiPath,
    schemaMode: config.schemaMode,
    bindingName: ABI_BINDING_NAME,
  });

  const goroutinePool = createGoroutinePool(ffiTransport, {
    poolSize: config.goroutinePoolSize ?? 4,
    concurrencyModel: config.concurrencyModel ?? 'goroutines',
  });

  const channelManager = createChannelManager({
    bufferSize: config.channelBufferSize ?? 16,
  });

  const memoryTracker = createMemoryTracker({
    gcFraction: config.gcFraction,
  });

  const schemaResolver = createSchemaResolver({
    schemaMode: config.schemaMode,
    goVersion: config.ffiDescriptor?.goVersion,
  });

  function syncGoroutineCount(): void {
    memoryTracker.setGoroutineCount(goroutinePool.getStats().activeGoroutines);
  }

  const bridge: GoBindingBridge = {
    async initialize(): Promise<void> {
      if (typeof config.ffiPath !== 'string' || config.ffiPath.trim().length === 0) {
        throw new Error(`Invalid ffiPath: ${config.ffiPath}`);
      }
      if (!schemaResolver.validate(config.schemaMode)) {
        throw new Error(`Invalid schemaMode: ${config.schemaMode}`);
      }
      initialized = true;
    },

    async invoke(fn: string | object, args: unknown[]): Promise<unknown> {
      const functionId = normalizeFunctionIdentifier(fn);
      const envelope = ffiTransport.buildEnvelope(functionId ?? '<unknown>', args);

      if (!initialized) {
        return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized', envelope };
      }
      if (!functionId) {
        return { code: 'MISSING_SYMBOL', message: 'Function identifier was not provided', envelope };
      }

      return ffiTransport.dispatch(envelope);
    },

    async destroy(): Promise<void> {
      goroutinePool.destroy();
      channelManager.destroy();
      memoryTracker.destroy();
      ffiTransport.destroy();
      schemaResolver.destroy();
      initialized = false;
    },

    getMemoryUsage(): GoMemoryStats {
      syncGoroutineCount();
      return memoryTracker.snapshot();
    },

    getSchemaMode() {
      return schemaResolver.getMode();
    },

    isInitialized(): boolean {
      return initialized;
    },

    async submitTask(taskId: string, fn: string | object, args: unknown[]): Promise<unknown> {
      if (!initialized) {
        return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized' };
      }
      const result = await goroutinePool.submit(taskId, fn, args);
      syncGoroutineCount();
      return result;
    },

    getPoolStats(): PoolStats {
      return goroutinePool.getStats();
    },

    get ffiTransport() { return ffiTransport; },
    get goroutinePool() { return goroutinePool; },
    get channelManager() { return channelManager; },
    get memoryTracker() { return memoryTracker; },
    get schemaResolver() { return schemaResolver; },
  };

  return bridge;
}
