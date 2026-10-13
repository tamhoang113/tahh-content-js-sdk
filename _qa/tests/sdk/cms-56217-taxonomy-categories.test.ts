/**
 * CMS-56217: Support CMS Taxonomy categories in SDK — SDK API verification
 *
 * Fixture-driven: test data is provisioned from the single source of truth in
 * `_qa/fixtures/cms-56217.ts` (via the Integration API) instead of being added
 * to the site by hand. Tests resolve each case to a real `key`/`path` at runtime
 * and never hardcode a GUID, URL path, or display name.
 *
 * Prerequisites:
 *   1. Content types pushed: cd samples/nextjs-template && npx @optimizely/cms-cli config push
 *   2. Taxonomy terms exist in Category Admin (Taxonomy, Taxonomy_Level3, Taxonomy_Internal)
 *   3. CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_56217) = a parent container GUID
 *   4. Dev server running: cd samples/nextjs-template && pnpm dev
 *
 * Run:
 *   pnpm test:sdk -- cms-56217
 *
 * If the container env is not set, the whole suite is skipped (so CI without a
 * seeded site stays green).
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { callSdkApi } from '../../helpers/sdk-api.js';
import { ensureStoryFixtures, resolveTestContainer } from '../../helpers/fixtures.js';
import type { ResolvedFixture } from '../../fixtures/types.js';
import { CMS_56217, type CMS56217CaseId } from '../../fixtures/cms-56217.js';

type ResolvedCategory = {
  key: string;
  displayName: string | null;
  path: Array<{ key: string; displayName: string | null }>;
};

const config = loadSiteConfig('nextjs-template');
const container = resolveTestContainer(CMS_56217.ticket);

// If the test container isn't configured, skip the whole suite with a clear
// signal rather than failing — this suite provisions live data and needs a
// parent container GUID (CMS_TEST_CONTAINER or CMS_TEST_CONTAINER_CMS_56217).
describe.skipIf(!container)('CMS-56217: Taxonomy Categories Support', () => {
  let fixtures: Record<CMS56217CaseId, ResolvedFixture>;

  beforeAll(async () => {
    fixtures = await ensureStoryFixtures(config, CMS_56217, {
      container: container!,
    });
  }, 120_000);

  // getContentByPath is the primary public API consumers use to render a page in
  // view mode, so every case is driven through it (not getContent-by-key).
  async function fetchFirstByPath(path: string, resolveTaxonomy = false) {
    const params: Record<string, string> = { path };
    if (resolveTaxonomy) params.resolveTaxonomy = 'true';
    const result = await callSdkApi(config, 'getContentByPath', params);
    expect(result.error, `getContentByPath("${path}") failed: ${result.error}`).toBeFalsy();
    const data = result.data;
    return Array.isArray(data) ? data[0] : data;
  }

  test('_metadata.categories is included (single category)', async () => {
    const def = CMS_56217.cases.oneTaxonomy;
    const content = await fetchFirstByPath(fixtures.oneTaxonomy.path);
    expect(content?._metadata, '_metadata should be present').toBeDefined();

    const categories = content._metadata?.categories as string[] | undefined;
    expect(Array.isArray(categories), 'categories should be an array').toBe(true);
    expect(categories).toHaveLength(def.expected!.rawCategoryCount as number);
    categories!.forEach((uri: string, i: number) => {
      expect(typeof uri, `categories[${i}] should be a string`).toBe('string');
      expect(uri.length, `categories[${i}] should not be empty`).toBeGreaterThan(0);
    });
  });

  test('content with no categories returns empty array', async () => {
    const content = await fetchFirstByPath(fixtures.noTaxonomy.path);
    const categories = content._metadata?.categories as string[] | undefined;

    // Empty array = data-level "no categories assigned" (distinct from undefined,
    // which would mean taxonomy is not supported at schema level).
    expect(Array.isArray(categories), 'categories should be an array').toBe(true);
    expect(categories).toEqual([]);
  });

  test('resolveTaxonomy: true populates _metadata.resolvedCategories', async () => {
    const def = CMS_56217.cases.multiTaxonomy;
    const content = await fetchFirstByPath(fixtures.multiTaxonomy.path, true);
    const resolvedCategories = content?._metadata?.resolvedCategories as
      | ResolvedCategory[]
      | undefined;

    expect(
      resolvedCategories,
      '_metadata.resolvedCategories should be present when resolveTaxonomy: true',
    ).toBeDefined();
    expect(resolvedCategories).toHaveLength(def.expected!.rawCategoryCount as number);

    const rawCategories = content._metadata?.categories as string[] | undefined;
    if (rawCategories) {
      // 1:1 correspondence in order.
      expect(resolvedCategories!.length).toBe(rawCategories.length);
      resolvedCategories!.forEach((resolved: ResolvedCategory, i: number) => {
        expect(resolved.key, `resolvedCategories[${i}].key required`).toBeTruthy();
        expect(Array.isArray(resolved.path), `resolvedCategories[${i}].path is array`).toBe(true);
      });
    }
  });

  test('hierarchical category exposes a path breadcrumb', async () => {
    const content = await fetchFirstByPath(fixtures.multiHierarchical.path, true);
    const resolvedCategories = content?._metadata?.resolvedCategories as
      | ResolvedCategory[]
      | undefined;

    expect(resolvedCategories, 'resolvedCategories should be present').toBeDefined();
    const first = resolvedCategories![0];
    expect(Array.isArray(first?.path), 'path should be an array').toBe(true);

    // Documented contract (docs/16-taxonomy-categories.md, spec FR-005): `path`
    // is the full breadcrumb from root to the term, and the term itself is the
    // last element with a `key` matching the resolved category's `key`.
    //
    // This is asserted STRICTLY on purpose so real SDK deviations surface as
    // failures (so they can be logged/reported), rather than being hidden:
    //   - path is currently leaf-only (length 1) for a nested term, and
    //   - path[].key is a bare term key while the top-level key is a full URI.
    const last = first.path[first.path.length - 1];
    expect(
      last?.key,
      'path[last].key should equal the resolved category key (full breadcrumb + matching URI)',
    ).toBe(first.key);
  });
});
