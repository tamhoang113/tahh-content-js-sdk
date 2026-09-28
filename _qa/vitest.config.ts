import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 60_000,
    reporters: ['default', 'json'],
    outputFile: {
      json: 'test-results/.vitest-results.json',
    },
  },
});
