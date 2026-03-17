import type { ChannelConfig, ChannelManagerAPI, GoChannel } from './types.js';

function createChannel<T = unknown>(name: string, bufferSize: number): GoChannel<T> {
  const buf: T[] = [];
  let isClosed = false;

  return {
    get name() { return name; },
    get bufferSize() { return bufferSize; },
    get length() { return buf.length; },
    get closed() { return isClosed; },

    send(value: T): boolean {
      if (isClosed) throw new Error(`Channel "${name}" is closed`);
      if (buf.length >= bufferSize) return false;
      buf.push(value);
      return true;
    },

    receive(): T | undefined {
      return buf.shift();
    },

    close(): void {
      isClosed = true;
    },
  };
}

export function createChannelManager(config: ChannelConfig): ChannelManagerAPI {
  const channels = new Map<string, GoChannel<unknown>>();
  const defaultBufferSize = config.bufferSize;

  return {
    create<T = unknown>(name: string, bufferSize?: number): GoChannel<T> {
      const ch = createChannel<T>(name, bufferSize ?? defaultBufferSize);
      channels.set(name, ch as GoChannel<unknown>);
      return ch;
    },

    get<T = unknown>(name: string): GoChannel<T> | undefined {
      return channels.get(name) as GoChannel<T> | undefined;
    },

    delete(name: string): void {
      channels.get(name)?.close();
      channels.delete(name);
    },

    listNames(): string[] {
      return Array.from(channels.keys());
    },

    destroy(): void {
      for (const ch of channels.values()) ch.close();
      channels.clear();
    },
  };
}
