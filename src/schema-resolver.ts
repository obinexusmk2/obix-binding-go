import type {
  ResolvedSchema,
  SchemaMode,
  SchemaResolverAPI,
  SchemaResolverConfig,
} from './types.js';

const VALID_MODES: readonly SchemaMode[] = ['monoglot', 'polyglot', 'hybrid'];

export function createSchemaResolver(config: SchemaResolverConfig): SchemaResolverAPI {
  const mode = config.schemaMode;

  return {
    resolve(): ResolvedSchema {
      return {
        mode,
        version: config.goVersion ?? 'unknown',
        supportsMultiLanguage: mode === 'polyglot' || mode === 'hybrid',
        requiresCGO: mode === 'polyglot',
      };
    },

    validate(m: SchemaMode): boolean {
      return (VALID_MODES as readonly string[]).includes(m);
    },

    getMode(): SchemaMode {
      return mode;
    },

    destroy(): void {
      // Stateless
    },
  };
}
