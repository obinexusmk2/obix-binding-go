import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFFITransport, normalizeFunctionIdentifier } from '../src/ffi-transport';

const BASE_CONFIG = {
  ffiPath: '/tmp/obix-go.so',
  schemaMode: 'hybrid' as const,
  bindingName: 'go',
};

describe('normalizeFunctionIdentifier', () => {
  it('returns a plain string as-is', () => {
    expect(normalizeFunctionIdentifier('ping')).toBe('ping');
  });

  it('resolves functionId from object descriptor', () => {
    expect(normalizeFunctionIdentifier({ functionId: 'go_fn' })).toBe('go_fn');
  });

  it('falls back to id when functionId is absent', () => {
    expect(normalizeFunctionIdentifier({ id: 'alt_id' })).toBe('alt_id');
  });

  it('falls back to name when id and functionId are absent', () => {
    expect(normalizeFunctionIdentifier({ name: 'named' })).toBe('named');
  });

  it('returns undefined for empty string', () => {
    expect(normalizeFunctionIdentifier('')).toBeUndefined();
  });

  it('returns undefined for empty object', () => {
    expect(normalizeFunctionIdentifier({})).toBeUndefined();
  });
});

describe('createFFITransport', () => {
  afterEach(() => {
    delete (globalThis as any).__obixAbiInvoker;
    vi.restoreAllMocks();
  });

  it('buildEnvelope produces correct shape', () => {
    const transport = createFFITransport(BASE_CONFIG);
    const envelope = transport.buildEnvelope('myFn', [1, 2]);

    expect(envelope.functionId).toBe('myFn');
    expect(envelope.args).toEqual([1, 2]);
    expect(envelope.metadata.binding).toBe('go');
    expect(envelope.metadata.schemaMode).toBe('hybrid');
    expect(envelope.metadata.ffiPath).toBe('/tmp/obix-go.so');
    expect(typeof envelope.metadata.timestampMs).toBe('number');
    expect(envelope.metadata.timestampMs).toBeGreaterThan(0);
  });

  it('dispatch returns MISSING_SYMBOL when __obixAbiInvoker is absent', async () => {
    const transport = createFFITransport(BASE_CONFIG);
    const envelope = transport.buildEnvelope('ping', []);
    const result = await transport.dispatch(envelope);
    expect(result).toMatchObject({ code: 'MISSING_SYMBOL' });
  });

  it('dispatch invokes __obixAbiInvoker.invoke with serialized envelope', async () => {
    const mockInvoke = vi.fn().mockResolvedValue({ ok: true });
    (globalThis as any).__obixAbiInvoker = { invoke: mockInvoke };

    const transport = createFFITransport(BASE_CONFIG);
    const envelope = transport.buildEnvelope('ping', [42]);
    const result = await transport.dispatch(envelope);

    expect(mockInvoke).toHaveBeenCalledWith(JSON.stringify(envelope));
    expect(result).toEqual({ ok: true });
  });

  it('dispatch returns INVOCATION_FAILED when invoker throws', async () => {
    (globalThis as any).__obixAbiInvoker = {
      invoke: () => { throw new Error('boom'); },
    };

    const transport = createFFITransport(BASE_CONFIG);
    const envelope = transport.buildEnvelope('explode', []);
    const result = await transport.dispatch(envelope) as any;

    expect(result.code).toBe('INVOCATION_FAILED');
    expect(result.cause).toBeInstanceOf(Error);
  });

  it('destroy is a no-op and does not throw', () => {
    const transport = createFFITransport(BASE_CONFIG);
    expect(() => transport.destroy()).not.toThrow();
  });
});
