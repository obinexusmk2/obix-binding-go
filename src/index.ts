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

function normalizeFunctionIdentifier(fn: string | object): string | undefined {
  if (typeof fn === 'string' && fn.trim()) return fn;
  if (fn && typeof fn === 'object') {
    const descriptor = fn as { functionId?: string; id?: string; name?: string };
    return descriptor.functionId ?? descriptor.id ?? descriptor.name;
  }
  return undefined;
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
export function createGoBinding(config: GoBindingConfig): GoBindingBridge {
  let initialized = false;
  const abiBindingName = 'go';
  return {
    async initialize(): Promise<void> {
      if (typeof config.ffiPath !== 'string' || config.ffiPath.trim().length === 0) {
        throw new Error(`Invalid ffiPath: ${config.ffiPath}`);
      }
      initialized = true;
    },

    async invoke(fn: string | object, args: unknown[]): Promise<unknown> {
      const functionId = normalizeFunctionIdentifier(fn);
      const envelope: InvocationEnvelope = {
        functionId: functionId ?? '<unknown>',
        args,
        metadata: {
          schemaMode: config.schemaMode,
          binding: abiBindingName,
          timestampMs: Date.now(),
          ffiPath: config.ffiPath,
        },
      };

      if (!initialized) {
        return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized', envelope } satisfies BindingInvokeError;
      }

      if (!functionId) {
        return { code: 'MISSING_SYMBOL', message: 'Function identifier was not provided', envelope } satisfies BindingInvokeError;
      }

      const abiInvoker = (globalThis as typeof globalThis & { __obixAbiInvoker?: BindingAbiInvoker }).__obixAbiInvoker;
      if (!abiInvoker?.invoke) {
        return {
          code: 'MISSING_SYMBOL',
          message: 'Required ABI symbol __obixAbiInvoker.invoke is unavailable',
          envelope,
        } satisfies BindingInvokeError;
      }

      try {
        return await abiInvoker.invoke(JSON.stringify(envelope));
      } catch (cause) {
        return {
          code: 'INVOCATION_FAILED',
          message: 'Invocation failed at ABI boundary',
          envelope,
          cause,
        } satisfies BindingInvokeError;
      }
    },

    async destroy(): Promise<void> {
      initialized = false;
    },

    getMemoryUsage() {
      return {
        allocBytes: 0,
        totalAllocBytes: 0,
        sysBytes: 0,
        numGC: 0,
        goroutineCount: 0,
      };
    },

    getSchemaMode(): SchemaMode {
      return config.schemaMode;
    },

    isInitialized(): boolean {
      return initialized;
    },

    async submitTask(
      taskId: string,
      fn: string | object,
      args: unknown[]
    ): Promise<unknown> {
      // Stub implementation
      console.log('Submitting task:', taskId);
      return undefined;
    },

    getPoolStats() {
      return {
        activeGoroutines: 0,
        queuedTasks: 0,
        completedTasks: 0,
      };
    },
  };
}

