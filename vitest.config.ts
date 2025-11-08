import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.wrangler/',
        '.turbo/',
        '**/src/client/',
        'coverage/',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
});
