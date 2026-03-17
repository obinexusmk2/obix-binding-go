function createChannel(name, bufferSize) {
    const buf = [];
    let isClosed = false;
    return {
        get name() { return name; },
        get bufferSize() { return bufferSize; },
        get length() { return buf.length; },
        get closed() { return isClosed; },
        send(value) {
            if (isClosed)
                throw new Error(`Channel "${name}" is closed`);
            if (buf.length >= bufferSize)
                return false;
            buf.push(value);
            return true;
        },
        receive() {
            return buf.shift();
        },
        close() {
            isClosed = true;
        },
    };
}
export function createChannelManager(config) {
    const channels = new Map();
    const defaultBufferSize = config.bufferSize;
    return {
        create(name, bufferSize) {
            const ch = createChannel(name, bufferSize ?? defaultBufferSize);
            channels.set(name, ch);
            return ch;
        },
        get(name) {
            return channels.get(name);
        },
        delete(name) {
            channels.get(name)?.close();
            channels.delete(name);
        },
        listNames() {
            return Array.from(channels.keys());
        },
        destroy() {
            for (const ch of channels.values())
                ch.close();
            channels.clear();
        },
    };
}
//# sourceMappingURL=channel-manager.js.map