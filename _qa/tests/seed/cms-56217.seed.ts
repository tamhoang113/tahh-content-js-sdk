/**
 * Seed script — CMS-56217 taxonomy fixtures.
 *
 * Provisions (or reuses) the taxonomy test content on the configured site so the
 * SDK tests have data to run against, WITHOUT running any assertions. Idempotent:
 * existing content (by display name) is reused, missing content is created via
 * the Integration API.
 *
 * Run:
 *   pnpm seed:cms-56217
 *
 * Requires CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_56217) to point at the
 * parent container GUID new content is created under.
 *
 * This lives under tests/seed/ (not tests/sdk/) so it never runs as part of
 * `pnpm test:sdk`.
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { ensureStoryFixtures, resolveTestContainer } from '../../helpers/fixtures.js';
import { CMS_56217 } from '../../fixtures/cms-56217.js';

const config = loadSiteConfig('nextjs-template');
const container = resolveTestContainer(CMS_56217.ticket);

describe('seed: CMS-56217 taxonomy fixtures', () => {
  test('ensure all taxonomy fixtures exist and are queryable', async () => {
    if (!container) {
      throw new Error(
        'CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_56217) is not set — ' +
          'point it at a parent container GUID before seeding.',
      );
    }

    const fixtures = await ensureStoryFixtures(config, CMS_56217, { container });

    for (const [caseId, resolved] of Object.entries(fixtures)) {
      const action = resolved.created ? 'created' : 'reused';
      // eslint-disable-next-line no-console
      console.log(
        `[seed] ${caseId}: ${action} key=${resolved.key} path=${resolved.path}`,
      );
      expect(resolved.key, `${caseId} should resolve to a key`).toBeTruthy();
    }
  }, 180_000);
});
