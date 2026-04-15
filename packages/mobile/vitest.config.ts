import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // Resolve @axonsdk/sdk to TypeScript source during tests (no build needed)
      '@axonsdk/sdk': resolve(__dirname, '../sdk/src/index.ts'),
    },
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js'],
    },
  },
  test: {
    environment: 'node',
  },
});
