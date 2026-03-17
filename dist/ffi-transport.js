export function normalizeFunctionIdentifier(fn) {
    if (typeof fn === 'string' && fn.trim())
        return fn;
    if (fn && typeof fn === 'object') {
        const d = fn;
        return d.functionId ?? d.id ?? d.name;
    }
    return undefined;
}
export function createFFITransport(config) {
    return {
        buildEnvelope(functionId, args) {
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
        async dispatch(envelope) {
            const abiInvoker = globalThis.__obixAbiInvoker;
            if (!abiInvoker?.invoke) {
                return {
                    code: 'MISSING_SYMBOL',
                    message: 'Required ABI symbol __obixAbiInvoker.invoke is unavailable',
                    envelope,
                };
            }
            try {
                return await abiInvoker.invoke(JSON.stringify(envelope));
            }
            catch (cause) {
                return {
                    code: 'INVOCATION_FAILED',
                    message: 'Invocation failed at ABI boundary',
                    envelope,
                    cause,
                };
            }
        },
        destroy() {
            // Stateless — nothing to clean up
        },
    };
}
//# sourceMappingURL=ffi-transport.js.map