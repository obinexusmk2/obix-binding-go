# @obinexusltd/obix-binding-go

TypeScript bindings for OBIX Go runtime integration through the libpolycall ABI bridge.

## Overview

`@obinexusltd/obix-binding-go` provides a small bridge API for:

- Creating and initializing a Go binding configuration
- Invoking ABI-backed polyglot functions with structured envelopes
- Returning consistent typed invocation errors
- Exposing placeholder runtime and pool statistics interfaces

## Installation

```bash
npm install @obinexusltd/obix-binding-go
```

## Usage

```ts
import { createGoBinding } from '@obinexusltd/obix-binding-go';

const binding = createGoBinding({
  ffiPath: '/path/to/libpolycall.so',
  goPath: '/usr/local/go',
  schemaMode: 'hybrid',
  memoryModel: 'gc',
  cgoEnabled: true,
  goroutinePoolSize: 16,
  concurrencyModel: 'goroutines',
});

await binding.initialize();

const result = await binding.invoke('exampleFunction', ['arg1', 42]);
console.log(result);

await binding.destroy();
```

## API

### `createGoBinding(config: GoBindingConfig): GoBindingBridge`

Creates a binding bridge with lifecycle and invocation methods:

- `initialize()`
- `invoke(fn, args)`
- `destroy()`
- `getMemoryUsage()`
- `getSchemaMode()`
- `isInitialized()`
- `submitTask(taskId, fn, args)`
- `getPoolStats()`

## Error model

Invocation errors are returned as typed objects:

- `NOT_INITIALIZED`
- `MISSING_SYMBOL`
- `INVOCATION_FAILED`

Each includes the invocation envelope metadata for easier debugging at ABI boundaries.

## Development

```bash
npm run build
npm test
```

## License

MIT
