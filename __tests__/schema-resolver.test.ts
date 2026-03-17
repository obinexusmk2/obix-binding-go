import { describe, expect, it } from 'vitest';
import { createSchemaResolver } from '../src/schema-resolver';

describe('createSchemaResolver', () => {
  it('getMode returns the configured schema mode', () => {
    const resolver = createSchemaResolver({ schemaMode: 'polyglot' });
    expect(resolver.getMode()).toBe('polyglot');
  });

  it('resolve — monoglot: supportsMultiLanguage=false, requiresCGO=false', () => {
    const schema = createSchemaResolver({ schemaMode: 'monoglot' }).resolve();
    expect(schema.supportsMultiLanguage).toBe(false);
    expect(schema.requiresCGO).toBe(false);
    expect(schema.mode).toBe('monoglot');
  });

  it('resolve — polyglot: supportsMultiLanguage=true, requiresCGO=true', () => {
    const schema = createSchemaResolver({ schemaMode: 'polyglot' }).resolve();
    expect(schema.supportsMultiLanguage).toBe(true);
    expect(schema.requiresCGO).toBe(true);
  });

  it('resolve — hybrid: supportsMultiLanguage=true, requiresCGO=false', () => {
    const schema = createSchemaResolver({ schemaMode: 'hybrid' }).resolve();
    expect(schema.supportsMultiLanguage).toBe(true);
    expect(schema.requiresCGO).toBe(false);
  });

  it('resolve includes goVersion when provided', () => {
    const resolver = createSchemaResolver({ schemaMode: 'hybrid', goVersion: '1.22' });
    expect(resolver.resolve().version).toBe('1.22');
  });

  it('resolve uses "unknown" when goVersion is absent', () => {
    const resolver = createSchemaResolver({ schemaMode: 'monoglot' });
    expect(resolver.resolve().version).toBe('unknown');
  });

  it('validate returns true for all valid modes', () => {
    const resolver = createSchemaResolver({ schemaMode: 'monoglot' });
    expect(resolver.validate('monoglot')).toBe(true);
    expect(resolver.validate('polyglot')).toBe(true);
    expect(resolver.validate('hybrid')).toBe(true);
  });

  it('validate returns false for an unrecognized mode string', () => {
    const resolver = createSchemaResolver({ schemaMode: 'monoglot' });
    expect(resolver.validate('wasm' as any)).toBe(false);
  });

  it('destroy does not throw', () => {
    const resolver = createSchemaResolver({ schemaMode: 'hybrid' });
    expect(() => resolver.destroy()).not.toThrow();
  });
});
