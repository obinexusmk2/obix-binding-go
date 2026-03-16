import { describe, expect, it } from 'vitest';

import { createGoBinding } from '../src/index';

describe('go binding smoke', () => {
  it('toggles initialize/destroy state and uses shared invocation envelope', async () => {
    const ffiPath = '/tmp/obix-go-ffi.mock';

    const binding = createGoBinding({
      ffiPath,
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
      goPath: '/usr/bin/go',
    } as any);

    expect(binding.isInitialized()).toBe(false);

    const beforeInit = await binding.invoke('ping', [1]);
    expect(beforeInit).toMatchObject({ code: 'NOT_INITIALIZED' });

    await binding.initialize();
    expect(binding.isInitialized()).toBe(true);

    const noSymbol = await binding.invoke('ping', [1]);
    expect(noSymbol).toMatchObject({ code: 'MISSING_SYMBOL' });

    (globalThis as any).__obixAbiInvoker = {
      invoke: (payload: string) => {
        const envelope = JSON.parse(payload);
        return { ok: true, echo: envelope };
      },
    };

    const result = await binding.invoke('ping', [1, 2, 3]);
    expect(result).toMatchObject({
      ok: true,
      echo: {
        functionId: 'ping',
        args: [1, 2, 3],
        metadata: { binding: 'go', ffiPath },
      },
    });

    delete (globalThis as any).__obixAbiInvoker;
    await binding.destroy();
    expect(binding.isInitialized()).toBe(false);
  });
});
