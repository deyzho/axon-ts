import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // Resolve @phonixsdk/sdk to TypeScript source during tests (no build needed)
      '@phonixsdk/sdk': resolve(__dirname, '../sdk/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
  },
});
