import { defineConfig } from 'vitest/config';

/**
 * Separate config for fixture SEED runs.
 *
 * Seeds provision live CMS data (via the Integration API) and must never run as
 * part of the normal test suites. The default `vitest.config.ts` only includes
 * `*.test.ts`; seeds use the `*.seed.ts` suffix and are run explicitly through
 * this config (see the `seed:*` scripts in package.json).
 */
export default defineConfig({
  test: {
    include: ['tests/seed/**/*.seed.ts'],
    testTimeout: 180_000,
    hookTimeout: 180_000,
    reporters: ['default'],
  },
});
