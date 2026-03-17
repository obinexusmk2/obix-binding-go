import type {
  BindingAbiInvoker,
  BindingInvokeError,
  FFITransportAPI,
  FFITransportConfig,
  InvocationEnvelope,
} from './types.js';

export function normalizeFunctionIdentifier(fn: string | object): string | undefined {
  if (typeof fn === 'string' && fn.trim()) return fn;
  if (fn && typeof fn === 'object') {
    const d = fn as { functionId?: string; id?: string; name?: string };
    return d.functionId ?? d.id ?? d.name;
  }
  return undefined;
}

export function createFFITransport(config: FFITransportConfig): FFITransportAPI {
  return {
    buildEnvelope(functionId: string, args: unknown[]): InvocationEnvelope {
      return {
        functionId,
        args,
        metadata: {
          schemaMode: config.schemaMode,
          binding: config.bindingName,
          timestampMs: Date.now(),
          ffiPath: config.ffiPath,
        },
      };
    },

    async dispatch(envelope: InvocationEnvelope): Promise<unknown> {
      const abiInvoker = (
        globalThis as typeof globalThis & { __obixAbiInvoker?: BindingAbiInvoker }
      ).__obixAbiInvoker;

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

    destroy(): void {
      // Stateless — nothing to clean up
    },
  };
}
