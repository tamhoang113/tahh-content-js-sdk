/**
 * CMS-54651: Multi-Contract Content Type — SDK API verification
 *
 * Verifies that SDK public API (getContentByPath) returns all properties
 * including those inherited from contracts.
 *
 * Prerequisites:
 *   1. Content types pushed:  cd samples/nextjs-template && opti-cms push
 *   2. Test content created on CMS (fill all properties)
 *   3. Content indexed to Graph
 *   4. Dev server running:    cd templates/stride && pnpm dev
 *
 * Run:
 *   pnpm test:sdk
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentByPath } from '../../helpers/sdk-api.js';

const config = loadSiteConfig('stride');

// Update these to match your actual test content URLs
const TEST_CONTENT = {
  contractPagePath: '/en/cms54651-page-with-multiple-contracts',
  arrayPagePath: '/en/cms54651-page-with-content-array',
};

describe('CMS-54651: MultiContract — getContentByPath', () => {

  test('contract page returns own + inherited properties', async () => {
    const results = await getContentByPath(config, TEST_CONTENT.contractPagePath);
    expect(results.length, `No content at "${TEST_CONTENT.contractPagePath}" — create test data or update path`).toBeGreaterThan(0);

    const content = results[0];

    // Own property
    expect(content.title, 'Own property "title" missing from SDK response').toBeTruthy();

    // TeaserContract properties (inherited via extends)
    expect(content.teaserTitle, 'Contract property "teaserTitle" missing — SDK did not expand contract').toBeTruthy();
    expect(content.teaserDescription, 'Contract property "teaserDescription" missing').toBeTruthy();

    // AnotherContract property (inherited via extends)
    expect(content.anotherField, 'Contract property "anotherField" missing — second contract not expanded').toBeTruthy();
  });

  test('array page returns child items with full data', async () => {
    const results = await getContentByPath(config, TEST_CONTENT.arrayPagePath);
    expect(results.length, `No content at "${TEST_CONTENT.arrayPagePath}"`).toBeGreaterThan(0);

    const content = results[0];
    const items = content.items ?? [];
    expect(items.length, '"items" array should contain child content').toBeGreaterThan(0);

    // Find the contract page in the array
    const contractPage = items.find((i: any) =>
      i._metadata?.types?.includes('CMS54651PageWithMultipleContracts') ||
      i.teaserTitle !== undefined
    );
    expect(contractPage, 'Array should contain CMS54651PageWithMultipleContracts').toBeTruthy();
    expect(contractPage.title, 'Nested contract page: "title" missing').toBeTruthy();
    expect(contractPage.teaserTitle, 'Nested contract page: "teaserTitle" missing').toBeTruthy();
    expect(contractPage.teaserDescription, 'Nested contract page: "teaserDescription" missing').toBeTruthy();
    expect(contractPage.anotherField, 'Nested contract page: "anotherField" missing').toBeTruthy();

    // Find the card in the array
    const card = items.find((i: any) =>
      i._metadata?.types?.includes('CMS54651CardContentType') ||
      i.cardTitle !== undefined
    );
    expect(card, 'Array should contain CMS54651CardContentType').toBeTruthy();
    expect(card.cardTitle, 'Nested card: "cardTitle" missing').toBeTruthy();
  });
});
