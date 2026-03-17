import { describe, expect, it } from 'vitest';
import { createChannelManager } from '../src/channel-manager';

describe('createChannelManager', () => {
  it('create returns a channel with the correct name and bufferSize', () => {
    const manager = createChannelManager({ bufferSize: 8 });
    const ch = manager.create('events', 4);
    expect(ch.name).toBe('events');
    expect(ch.bufferSize).toBe(4);
  });

  it('create uses the default bufferSize when none is supplied', () => {
    const manager = createChannelManager({ bufferSize: 16 });
    const ch = manager.create('data');
    expect(ch.bufferSize).toBe(16);
  });

  it('get retrieves a previously created channel', () => {
    const manager = createChannelManager({ bufferSize: 4 });
    manager.create('jobs');
    expect(manager.get('jobs')).toBeDefined();
  });

  it('get returns undefined for an unknown channel', () => {
    const manager = createChannelManager({ bufferSize: 4 });
    expect(manager.get('nonexistent')).toBeUndefined();
  });

  it('listNames returns all channel names', () => {
    const manager = createChannelManager({ bufferSize: 4 });
    manager.create('a');
    manager.create('b');
    manager.create('c');
    expect(manager.listNames().sort()).toEqual(['a', 'b', 'c']);
  });

  it('delete closes and removes the channel', () => {
    const manager = createChannelManager({ bufferSize: 4 });
    manager.create('temp');
    manager.delete('temp');
    expect(manager.get('temp')).toBeUndefined();
    expect(manager.listNames()).not.toContain('temp');
  });

  it('destroy closes all channels and empties the registry', () => {
    const manager = createChannelManager({ bufferSize: 4 });
    const ch1 = manager.create('x');
    const ch2 = manager.create('y');
    manager.destroy();
    expect(ch1.closed).toBe(true);
    expect(ch2.closed).toBe(true);
    expect(manager.listNames()).toHaveLength(0);
  });
});

describe('GoChannel', () => {
  it('send adds items FIFO; receive removes them in order', () => {
    const manager = createChannelManager({ bufferSize: 8 });
    const ch = manager.create<number>('fifo', 3);
    expect(ch.send(1)).toBe(true);
    expect(ch.send(2)).toBe(true);
    expect(ch.send(3)).toBe(true);
    expect(ch.receive()).toBe(1);
    expect(ch.receive()).toBe(2);
    expect(ch.receive()).toBe(3);
    expect(ch.receive()).toBeUndefined();
  });

  it('send returns false when buffer is full', () => {
    const manager = createChannelManager({ bufferSize: 2 });
    const ch = manager.create<number>('bounded', 2);
    expect(ch.send(1)).toBe(true);
    expect(ch.send(2)).toBe(true);
    expect(ch.send(3)).toBe(false);
    expect(ch.length).toBe(2);
  });

  it('send throws when channel is closed', () => {
    const manager = createChannelManager({ bufferSize: 4 });
    const ch = manager.create('closed-ch');
    ch.close();
    expect(() => ch.send('x')).toThrow(/closed/);
  });

  it('closed flag becomes true after close()', () => {
    const manager = createChannelManager({ bufferSize: 4 });
    const ch = manager.create('flag-ch');
    expect(ch.closed).toBe(false);
    ch.close();
    expect(ch.closed).toBe(true);
  });

  it('length reflects the current number of buffered items', () => {
    const manager = createChannelManager({ bufferSize: 4 });
    const ch = manager.create<string>('len-ch', 4);
    expect(ch.length).toBe(0);
    ch.send('a');
    ch.send('b');
    expect(ch.length).toBe(2);
    ch.receive();
    expect(ch.length).toBe(1);
  });
});
