/**
 * CMS-56675: getPath and getItems ignore language fallbacks and reject BCP-47 locales
 *
 * Bug: getContent(), getItems(), and getPath() filtered on `_metadata.locale` which
 *      excluded fallback documents, causing them to return null. Hyphenated locales
 *      like `nl-BE` were rejected with a GraphQL enum error.
 *
 * Fix (PR #619):
 *   1. Locale moved from WHERE `_metadata.locale` to `locale:` field argument
 *   2. BCP-47 canonicalization (`nl-BE` → `nl_BE`)
 *   3. Unset references normalized to `null`
 *
 * Fixture setup:
 *   - CMS language fallback configured: fr → nl, nl-BE → nl
 *   - One page published in `nl` locale ONLY (no fr or nl-BE version)
 *   - Tests request content in fr / nl-BE and expect the nl fallback to be returned
 *
 * Uses existing AutoStringAllFields content type — locale handling is type-agnostic.
 *
 * Prerequisites:
 *   1. AutoStringAllFields page created in CMS, published in `nl` locale only
 *   2. Language fallback configured: fr → nl, nl-BE → nl
 *   3. Dev server running:    cd samples/nextjs-template && pnpm dev
 *
 * Run:
 *   pnpm test:sdk -- cms-56675
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { callSdkApi } from '../../helpers/sdk-api.js';
import { findContentPathByDisplayName } from '../../helpers/graph-api.js';

const config = loadSiteConfig('nextjs-template');

const TEST_DISPLAY_NAME =
  process.env.CMS56675_TEST_DISPLAY_NAME ?? 'CMS56675_LocaleFallback_nl';

const EXPECTED_VALUES = {
  fullString:
    process.env.CMS56675_EXPECTED_FULL_STRING ?? 'This is master version in nl language',
};

describe('CMS-56675: Locale Fallback — SDK API', () => {
  let contentKey: string;
  let childKey: string;

  beforeAll(async () => {
    const lookup = await findContentPathByDisplayName(config, TEST_DISPLAY_NAME);
    if (!lookup) {
      throw new Error(
        `No content found with displayName "${TEST_DISPLAY_NAME}" — create the test page or set CMS56675_TEST_DISPLAY_NAME`,
      );
    }
    contentKey = lookup.key;

    const childLookup = await findContentPathByDisplayName(config, 'CMS56675_ChildItem_nl_BE');
    if (!childLookup) {
      throw new Error('CMS56675_ChildItem_nl_BE not found — create the fixture');
    }
    childKey = childLookup.key;
  });

  // ─── Core locale: nl (source language) ─────────────────────────────────────

  test('getContent with source locale (nl) returns content directly', async () => {
    const result = await callSdkApi(config, 'getContent', {
      key: contentKey,
      locale: 'nl',
    });

    expect(result.error).toBeUndefined();
    expect(result.data, 'getContent(nl) should return data').toBeTruthy();
    expect(result.data?.fullString).toBe(EXPECTED_VALUES.fullString);
  });

  // ─── Fallback: fr → nl ─────────────────────────────────────────────────────

  test('getContent with fallback locale (fr) returns nl content via fallback', async () => {
    // Before fix: returned null because _metadata.locale filter excluded the nl document
    // After fix: locale: field argument lets CMS resolve the fr → nl fallback
    const result = await callSdkApi(config, 'getContent', {
      key: contentKey,
      locale: 'fr',
    });

    expect(result.error).toBeUndefined();
    expect(
      result.data,
      'getContent(fr) should return nl fallback content, not null',
    ).toBeTruthy();
    expect(result.data?.fullString).toBe(EXPECTED_VALUES.fullString);
  });

  // ─── Hyphenated BCP-47: nl-BE → nl ─────────────────────────────────────────

  test('getContent with hyphenated locale (nl-BE) is accepted and returns fallback', async () => {
    // Before fix: GraphQL error "Variable \"$locale\" got invalid value \"nl-BE\""
    // After fix: canonicalized to nl_BE, accepted by Graph, fallback resolved
    const result = await callSdkApi(config, 'getContent', {
      key: contentKey,
      locale: 'nl-BE',
    });

    expect(result.error).toBeUndefined();
    expect(
      result.data,
      'getContent(nl-BE) should return nl fallback content',
    ).toBeTruthy();
    expect(result.data?.fullString).toBe(EXPECTED_VALUES.fullString);
  });

  // ─── getItems with fallback ─────────────────────────────────────────────────
  //
  // Fixture: 4 child items under CMS56675_LocaleFallback_nl
  //   - CMS56675_ChildItem_nl     (nl only)
  //   - CMS56675_ChildItem_fr     (fr only)
  //   - CMS56675_ChildItem_nl_BE  (nl-BE only)
  //   - CMS56675_ChildItem_en     (en only)
  //
  // Fallback config: fr → nl, nl-BE → nl
  // No fallback configured for en
  //
  // Expected results per locale:
  //   nl    → 1 item:  ChildItem_nl (direct)
  //   fr    → 2 items: ChildItem_fr (direct) + ChildItem_nl (nl fallback)
  //   nl-BE → 2 items: ChildItem_nl_BE (direct) + ChildItem_nl (nl fallback)
  //   en    → 0 items: no en fallback configured

  test('getItems(nl) returns only the nl child item', async () => {
    const result = await callSdkApi(config, 'getItems', {
      key: contentKey,
      locale: 'nl',
    });

    expect(result.error).toBeUndefined();
    const items = Array.isArray(result.data) ? result.data : result.data?.items ?? [];
    expect(items.length, 'getItems(nl) should return exactly 1 item').toBe(1);

    const displayNames = items.map((i: any) => i._metadata?.displayName);
    expect(displayNames).toContain('CMS56675_ChildItem_nl');
  });

  test('getItems(fr) returns fr item + nl fallback item', async () => {
    // Before fix: returned only ChildItem_fr (fallback items excluded by _metadata.locale filter)
    // After fix: fr → nl fallback resolved, both items returned
    const result = await callSdkApi(config, 'getItems', {
      key: contentKey,
      locale: 'fr',
    });

    expect(result.error).toBeUndefined();
    const items = Array.isArray(result.data) ? result.data : result.data?.items ?? [];
    expect(items.length, 'getItems(fr) should return 2 items (fr + nl fallback)').toBe(2);

    const displayNames = items.map((i: any) => i._metadata?.displayName);
    expect(displayNames, 'should contain the fr item').toContain('CMS56675_ChildItem_fr');
    expect(displayNames, 'should contain the nl fallback item').toContain('CMS56675_ChildItem_nl');
  });

  test('getItems(nl-BE) returns nl-BE item + nl fallback item', async () => {
    // Before fix: GraphQL error on hyphenated locale "nl-BE"
    // After fix: canonicalized to nl_BE, nl-BE → nl fallback resolved
    const result = await callSdkApi(config, 'getItems', {
      key: contentKey,
      locale: 'nl-BE',
    });

    expect(result.error).toBeUndefined();
    const items = Array.isArray(result.data) ? result.data : result.data?.items ?? [];
    expect(items.length, 'getItems(nl-BE) should return 2 items (nl-BE + nl fallback)').toBe(2);

    const displayNames = items.map((i: any) => i._metadata?.displayName);
    expect(displayNames, 'should contain the nl-BE item').toContain('CMS56675_ChildItem_nl_BE');
    expect(displayNames, 'should contain the nl fallback item').toContain('CMS56675_ChildItem_nl');
  });

  test('getItems(en) returns 0 items (no fallback configured for en)', async () => {
    const result = await callSdkApi(config, 'getItems', {
      key: contentKey,
      locale: 'en',
    });

    expect(result.error).toBeUndefined();
    const items = Array.isArray(result.data) ? result.data : result.data?.items ?? [];
    expect(items.length, 'getItems(en) should return 0 items — no en fallback configured').toBe(0);
  });

  // ─── getPath with child item ─────────────────────────────────────────────────
  //
  // Uses CMS56675_ChildItem_nl_BE as the target. getPath returns ancestors.
  //
  // getPath(nl-BE): parent resolved via nl fallback
  //   → [CMS56675_LocaleFallback_nl (parent), CMS56675_ChildItem_nl_BE (self)]
  //
  // getPath(no locale): full path from root, ancestors use default locales
  //   → [root..., Auto, CMS56675_LocaleFallback_nl, CMS56675_ChildItem_nl_BE]

  test('getPath(nl-BE) returns parent via nl fallback', async () => {
    // Before fix: hyphenated locale rejected with GraphQL error
    // After fix: nl-BE canonicalized, parent resolved via nl fallback
    const result = await callSdkApi(config, 'getPath', {
      key: childKey,
      locale: 'nl-BE',
    });

    expect(result.error).toBeUndefined();
    const path = Array.isArray(result.data) ? result.data : [];
    expect(path.length, 'getPath(nl-BE) should return 2 nodes (parent + self)').toBe(2);

    const displayNames = path.map((n: any) => n._metadata?.displayName);
    expect(displayNames[0], 'first node should be the parent (nl fallback)').toBe('CMS56675_LocaleFallback_nl');
    expect(displayNames[1], 'second node should be the child itself').toBe('CMS56675_ChildItem_nl_BE');

    // Verify parent uses nl locale (fallback from nl-BE → nl)
    expect(path[0]._metadata?.locale, 'parent locale should be nl (fallback source)').toBe('nl');
    expect(path[1]._metadata?.locale, 'child locale should be nl-BE').toBe('nl-BE');
  });

  test('getPath(no locale) returns full ancestor chain', async () => {
    const result = await callSdkApi(config, 'getPath', {
      key: childKey,
    });

    expect(result.error).toBeUndefined();
    const path = Array.isArray(result.data) ? result.data : [];
    expect(
      path.length,
      'getPath(no locale) should return full ancestor chain (root → ... → self)',
    ).toBeGreaterThanOrEqual(3);

    const displayNames = path.map((n: any) => n._metadata?.displayName);
    expect(displayNames[displayNames.length - 2], 'direct parent should be the parent').toBe('CMS56675_LocaleFallback_nl');
    expect(displayNames[displayNames.length - 1], 'last node should be self').toBe('CMS56675_ChildItem_nl_BE');
  });
});
