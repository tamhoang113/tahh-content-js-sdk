/**
 * CMS-54651: Multi-Contract Content Type — SDK API verification
 *
 * Verifies that SDK public API (getContentByPath) returns all properties
 * including those inherited from contracts.
 *
 * This test resolves each test page's *current* path dynamically by its
 * display name (via Graph) instead of hardcoding a URL — display names follow
 * the QA fixture convention (`CMS{id}_{ShortDesc}`) and rarely change, unlike
 * URL paths which can shift when content is moved in the tree.
 * See QA_CONTEXT.md §6.1 for the full rationale.
 *
 * Prerequisites:
 *   1. Content types pushed:  cd samples/nextjs-template && opti-cms push
 *   2. Test content created on CMS (fill all properties)
 *   3. Content indexed to Graph
 *   4. Dev server running:    cd samples/nextjs-template && pnpm dev
 *
 * Run:
 *   pnpm test:sdk
 *
 * Configure the fixtures' display names via env var if they differ:
 *   CMS54651_CONTRACT_TEST_DISPLAY_NAME="My Page" CMS54651_ARRAY_TEST_DISPLAY_NAME="My Array Page" pnpm test:sdk
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentByDisplayName } from '../../helpers/sdk-api.js';

const config = loadSiteConfig('nextjs-template');

const TEST_CONTENT = {
  contractDisplayName: process.env.CMS54651_CONTRACT_TEST_DISPLAY_NAME ?? 'CMS54651_MultipleContract',
  arrayDisplayName: process.env.CMS54651_ARRAY_TEST_DISPLAY_NAME ?? 'CMS54651_ContentArea',
};

describe('CMS-54651: MultiContract — getContentByPath', () => {

  test('contract page returns own + inherited properties', async () => {
    const { content, key, path } = await getContentByDisplayName(
      config,
      TEST_CONTENT.contractDisplayName,
      'CMS54651_CONTRACT_TEST_DISPLAY_NAME',
    );
    const fixtureLocation = `displayName="${TEST_CONTENT.contractDisplayName}" key="${key}" path="${path}"`;

    // Own property
    expect(content.title, `Own property "title" missing from SDK response. ${fixtureLocation}`).toBeTruthy();

    // TeaserContract properties (inherited via extends) — missing here means either
    // the SDK didn't expand the contract (bug regression) or the fixture content
    // wasn't filled in on this page (CMS fixture data issue) — check CMS first.
    expect(content.teaserTitle, `Contract property "teaserTitle" missing — SDK did not expand contract, or fixture not filled in. ${fixtureLocation}`).toBeTruthy();
    expect(content.teaserDescription, `Contract property "teaserDescription" missing. ${fixtureLocation}`).toBeTruthy();

    // AnotherContract property (inherited via extends)
    expect(content.anotherField, `Contract property "anotherField" missing — second contract not expanded. ${fixtureLocation}`).toBeTruthy();
  });

  test('array page returns child items with full data', async () => {
    const { content, key, path } = await getContentByDisplayName(
      config,
      TEST_CONTENT.arrayDisplayName,
      'CMS54651_ARRAY_TEST_DISPLAY_NAME',
    );
    const fixtureLocation = `displayName="${TEST_CONTENT.arrayDisplayName}" key="${key}" path="${path}"`;

    const items = content.items ?? [];
    expect(items.length, `"items" array should contain child content. ${fixtureLocation}`).toBeGreaterThan(0);

    // Find the contract page in the array
    const contractPage = items.find((i: any) =>
      i._metadata?.types?.includes('CMS54651PageWithMultipleContracts') ||
      i.teaserTitle !== undefined
    );
    expect(contractPage, `Array should contain CMS54651PageWithMultipleContracts. ${fixtureLocation}`).toBeTruthy();
    expect(contractPage.title, `Nested contract page: "title" missing. ${fixtureLocation}`).toBeTruthy();
    expect(contractPage.teaserTitle, `Nested contract page: "teaserTitle" missing. ${fixtureLocation}`).toBeTruthy();
    expect(contractPage.teaserDescription, `Nested contract page: "teaserDescription" missing. ${fixtureLocation}`).toBeTruthy();
    expect(contractPage.anotherField, `Nested contract page: "anotherField" missing. ${fixtureLocation}`).toBeTruthy();

    // Find the card in the array
    const card = items.find((i: any) =>
      i._metadata?.types?.includes('CMS54651CardContentType') ||
      i.cardTitle !== undefined
    );
    expect(card, `Array should contain CMS54651CardContentType. ${fixtureLocation}`).toBeTruthy();
    expect(card.cardTitle, `Nested card: "cardTitle" missing. ${fixtureLocation}`).toBeTruthy();
  });
});
