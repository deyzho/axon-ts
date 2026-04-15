import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Allow Vitest to resolve .js imports to their .ts source equivalents
    // when running tests directly against TypeScript source (not compiled dist).
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js'],
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/__tests__/**'],
    },
  },
});
