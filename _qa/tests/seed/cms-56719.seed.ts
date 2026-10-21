/**
 * Seed script — CMS-56719 variation filter fixtures.
 *
 * Verifies that the variation test content exists and is queryable on the
 * configured site. Because CMS variations cannot be created via the Integration
 * API, this seed uses `provision: 'manual'` — it only RESOLVES existing content
 * and fails with a recipe if something is missing.
 *
 * Run:
 *   pnpm seed:cms-56719
 *
 * Manual setup required (one-time in CMS UI):
 *   1. Create AutoStringAllFields page, displayName = "CMS_56719_VariationFilter"
 *   2. Set fullString = "base-value", publish
 *   3. Create variations: v_business, v_investments, v_mortgages, v_personal
 *   4. In each variation set fullString to the logical name (e.g. "business")
 *   5. Publish all variations
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { findContentPathByDisplayName } from '../../helpers/graph-api.js';
import { callSdkApi } from '../../helpers/sdk-api.js';
import { CMS_56719, VARIATION_DATA } from '../../fixtures/cms-56719.js';

const config = loadSiteConfig('nextjs-template');
const mainCase = CMS_56719.cases.variationPage;

describe('seed: CMS-56719 variation filter fixtures', () => {
  test('base page exists and is queryable by displayName', async () => {
    const lookup = await findContentPathByDisplayName(config, mainCase.automationId);

    if (!lookup) {
      throw new Error(
        `Fixture "${mainCase.automationId}" not found.\n\n` +
        `RECIPE — create manually in CMS UI:\n` +
        `  1. Create AutoStringAllFields page, displayName = "${mainCase.automationId}"\n` +
        `  2. Set fullString = "${mainCase.properties.fullString}", publish\n` +
        `  3. Create variations: ${VARIATION_DATA.filter(v => v.variation).map(v => v.variation).join(', ')}\n` +
        `  4. In each variation set fullString to the logical name\n` +
        `  5. Publish all variations\n`,
      );
    }

    console.log(`[seed] base page: key=${lookup.key} path=${lookup.path}`);
    expect(lookup.key).toBeTruthy();
  });

  test('all variations exist via variation: ALL', async () => {
    const lookup = await findContentPathByDisplayName(config, mainCase.automationId);
    expect(lookup, 'base page must exist first').toBeTruthy();

    const result = await callSdkApi(config, 'getContentByPath', {
      path: lookup!.path,
      variation: JSON.stringify({ include: 'ALL' }),
    }, { stored: false });

    expect(result.error, `SDK call failed: ${result.error}`).toBeUndefined();
    const items = Array.isArray(result.data) ? result.data : [];

    const expectedCount = VARIATION_DATA.length;
    if (items.length !== expectedCount) {
      const foundVariations = items.map((i: any) => i._metadata?.variation ?? 'BASE');
      const expectedVariations = VARIATION_DATA.map(v => v.variation ?? 'BASE');
      const missing = expectedVariations.filter(v => !foundVariations.includes(v));

      throw new Error(
        `Expected ${expectedCount} variations but found ${items.length}.\n` +
        `Found: ${foundVariations.join(', ')}\n` +
        `Missing: ${missing.join(', ')}\n\n` +
        `RECIPE — create missing variations in CMS UI, set fullString, and publish.`,
      );
    }

    for (const expected of VARIATION_DATA) {
      const label = expected.variation ?? 'BASE';
      const item = items.find((i: any) =>
        expected.variation === null
          ? !i._metadata?.variation
          : i._metadata?.variation === expected.variation,
      );
      expect(item, `variation "${label}" not found in results`).toBeTruthy();
      expect(item.fullString, `variation "${label}" fullString mismatch`).toBe(expected.fullString);

      console.log(`[seed] ${label}: fullString="${item.fullString}" ✓`);
    }
  }, 30_000);
});
