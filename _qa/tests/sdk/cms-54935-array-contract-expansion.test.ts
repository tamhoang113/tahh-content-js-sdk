/**
 * CMS-54935: Contract-based allowedTypes in array properties — SDK API verification
 *
 * Bug: `handleArrayProperty` didn't pass `expandContracts` through to the inner
 *      `convertProperty` call, so an array property whose `allowedTypes`
 *      references a contract only generated a fragment for the contract itself
 *      — not the concrete types implementing it (CMS54935CardComponentA/B).
 *      Nested card items came back with only `__typename` + `_metadata`, no
 *      actual properties (cardTitle, cardDescription, cardImage).
 * Fix:  PR #497 — handleArrayProperty now forwards the full QueryContext
 *       (including expandContracts) to convertProperty.
 *
 * This test resolves the test page's *current* path dynamically by its display
 * name (via Graph) instead of hardcoding a URL. See QA_CONTEXT.md §6.1.
 *
 * Prerequisites:
 *   1. Content types pushed:  cd samples/nextjs-template && opti-cms push
 *   2. Test page created + published in CMS containing a CMS54935CardContainer
 *      with `cards` array populated with at least one CMS54935CardComponentA
 *      and one CMS54935CardComponentB, each with their properties filled in
 *   3. Content indexed to Graph
 *   4. Dev server running:    cd samples/nextjs-template && pnpm dev
 *
 * Run:
 *   pnpm test:sdk
 *
 * Configure the fixture's display name via env var if it differs:
 *   CMS54935_TEST_DISPLAY_NAME="My Test Page" pnpm test:sdk
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentByDisplayName } from '../../helpers/sdk-api.js';

const config = loadSiteConfig('nextjs-template');

const TEST_DISPLAY_NAME = process.env.CMS54935_TEST_DISPLAY_NAME ?? 'CMS54935-MultiContract';

/**
 * Recursively search a content object graph (page → composition.nodes / array
 * items → ...) for the first node whose metadata types include the given key.
 */
function findNodeByType(node: any, typeKey: string, seen = new Set<any>()): any {
  if (!node || typeof node !== 'object' || seen.has(node)) return undefined;
  seen.add(node);

  const types: string[] | undefined = node._metadata?.types ?? node.content?._metadata?.types;
  const candidate = node.content ?? node;
  if (types?.includes(typeKey)) {
    return candidate;
  }

  const children: any[] = node.composition?.nodes ?? node.nodes ?? node.cards ?? [];
  for (const child of children) {
    const found = findNodeByType(child, typeKey, seen);
    if (found) return found;
  }

  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') {
      const found = findNodeByType(value, typeKey, seen);
      if (found) return found;
    }
  }

  return undefined;
}

describe('CMS-54935: array property with contract-based allowedTypes', () => {
  test('cards array resolves concrete type properties, not just contract metadata', async () => {
    const { content: page, key, path } = await getContentByDisplayName(
      config,
      TEST_DISPLAY_NAME,
      'CMS54935_TEST_DISPLAY_NAME',
    );
    const fixtureLocation = `displayName="${TEST_DISPLAY_NAME}" key="${key}" path="${path}"`;

    const container = findNodeByType(page, 'CMS54935CardContainer');
    expect(container, `CMS54935CardContainer node not found in page. ${fixtureLocation}`).toBeTruthy();

    const cards = container.cards ?? [];
    expect(cards.length, `"cards" array should contain at least one item. ${fixtureLocation}`).toBeGreaterThan(0);

    const cardA = cards.find((c: any) => c._metadata?.types?.includes('CMS54935CardComponentA'));
    const cardB = cards.find((c: any) => c._metadata?.types?.includes('CMS54935CardComponentB'));

    // Bug regression guard: if expandContracts is dropped again, the query only
    // returns the contract fragment — items would have __typename + _metadata
    // but no concrete properties (cardTitle stays undefined).
    expect(
      cardA,
      `No CMS54935CardComponentA item in "cards" — either fixture is missing this type, or expandContracts regressed (only contract fragment returned). ${fixtureLocation}`,
    ).toBeTruthy();
    expect(
      cardA?.cardTitle,
      `CardComponentA.cardTitle missing — expandContracts regression: query only generated the contract fragment, not the concrete type. ${fixtureLocation}`,
    ).toBeTruthy();
    expect(
      cardA?.cardDescription,
      `CardComponentA.cardDescription missing — expandContracts regression (contract-only fragment). ${fixtureLocation}`,
    ).toBeTruthy();

    expect(
      cardB,
      `No CMS54935CardComponentB item in "cards" — either fixture is missing this type, or expandContracts regressed. ${fixtureLocation}`,
    ).toBeTruthy();
    expect(
      cardB?.cardTitle,
      `CardComponentB.cardTitle missing — expandContracts regression (contract-only fragment). ${fixtureLocation}`,
    ).toBeTruthy();
    expect(
      cardB?.cardImage,
      `CardComponentB.cardImage missing — expandContracts regression (contract-only fragment). ${fixtureLocation}`,
    ).toBeTruthy();
  });
});
