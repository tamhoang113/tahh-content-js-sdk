/**
 * Seed script — CMS-49490 circular fragment fixtures.
 *
 * Provisions (or reuses) the circular-ref test content on the configured site so
 * the SDK tests have data to run against, WITHOUT running any assertions.
 * Idempotent: existing content (by display name) is reused; missing content is
 * imported from the committed .episerverdata package.
 *
 * Run:
 *   pnpm seed:cms-49490
 *
 * Requires CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_49490) to point at the
 * parent container GUID new content is created under.
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { ensureStoryFixtures, resolveTestContainer } from '../../helpers/fixtures.js';
import { CMS_49490 } from '../../fixtures/cms-49490.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer(CMS_49490.ticket);

describe('seed: CMS-49490 circular fragment fixtures', () => {
  test('ensure all circular-ref fixtures exist and are queryable', async () => {
    if (!container) {
      throw new Error(
        'CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_49490) is not set — ' +
          'point it at a parent container GUID before seeding.',
      );
    }

    const fixtures = await ensureStoryFixtures(config, CMS_49490, { container });

    for (const [caseId, resolved] of Object.entries(fixtures)) {
      const action = resolved.created ? 'created' : 'reused';
      console.log(
        `[seed] ${caseId}: ${action} key=${resolved.key} path=${resolved.path}`,
      );
      expect(resolved.key, `${caseId} should resolve to a key`).toBeTruthy();
    }
  }, 180_000);
});
