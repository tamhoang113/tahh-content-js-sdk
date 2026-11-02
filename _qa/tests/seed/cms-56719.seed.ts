/**
 * Seed script — CMS-56719 variation filter fixtures.
 *
 * Provisions the variation test content via Integration API:
 *   1. Creates PageStringProperty page with fullString = "base-value"
 *   2. Creates 4 variation versions (v_business, v_investments, v_mortgages, v_personal)
 *   3. Publishes all versions
 *
 * Run:
 *   pnpm seed:cms-56719
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { ensureStoryFixtures, resolveTestContainer } from '../../helpers/fixtures.js';
import { callSdkApi } from '../../helpers/sdk-api.js';
import { CMS_56719, VARIATION_DATA } from '../../fixtures/cms-56719.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer(CMS_56719.ticket);

describe('seed: CMS-56719 variation filter fixtures', () => {
  test('ensure all variation fixtures exist and are queryable', async () => {
    if (!container) {
      throw new Error(
        'CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_56719) is not set — ' +
          'point it at a parent container GUID before seeding.',
      );
    }

    const fixtures = await ensureStoryFixtures(config, CMS_56719, { container });

    for (const [caseId, resolved] of Object.entries(fixtures)) {
      const action = resolved.created ? 'created' : 'reused';
      console.log(
        `[seed] ${caseId}: ${action} key=${resolved.key} path=${resolved.path}`,
      );
      expect(resolved.key, `${caseId} should resolve to a key`).toBeTruthy();
    }
  }, 180_000);

  test('all variations exist via variation: ALL', async () => {
    if (!container) return;

    const fixtures = await ensureStoryFixtures(config, CMS_56719, { container });
    const result = await callSdkApi(config, 'getContentByPath', {
      path: fixtures.variationPage.path,
      variation: JSON.stringify({ include: 'ALL' }),
    }, { stored: false });

    expect(result.error, `SDK call failed: ${result.error}`).toBeUndefined();
    const items = Array.isArray(result.data) ? result.data : [];

    console.log(`[seed] Found ${items.length} variations (expected ${VARIATION_DATA.length})`);
    for (const item of items) {
      console.log(`  variation=${item._metadata?.variation ?? 'BASE'} fullString="${item.fullString}"`);
    }

    expect(items.length).toBe(VARIATION_DATA.length);
  }, 60_000);
});
