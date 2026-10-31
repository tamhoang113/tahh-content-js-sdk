/**
 * CMS-54651: Multi-Contract Content Type — View + Edit Mode (Playwright)
 *
 * Browser-level tests that verify rendered pages and CMS edit mode.
 * SDK API tests are in tests/sdk/cms-54651-multi-contract.test.ts (vitest).
 *
 * Prerequisites:
 *   1. Content types pushed:  cd samples/nextjs-template && opti-cms push
 *   2. Test content created + indexed to Graph
 *   3. Dev server running:    cd samples/nextjs-template && pnpm dev
 *
 * Run:
 *   pnpm test:e2e -- --grep "CMS-54651"
 *   pnpm test:e2e -- --grep "View" --headed
 *   pnpm test:e2e -- --grep "Edit" --headed
 *
 * Configure the fixtures' display names via env var if they differ:
 *   CMS54651_CONTRACT_TEST_DISPLAY_NAME="My Page" CMS54651_ARRAY_TEST_DISPLAY_NAME="My Array Page" pnpm test:e2e -- --grep "CMS-54651"
 */

import { test, expect } from '@playwright/test';
import {
  loadSiteConfig,
  loginToCms,
  openContentById,
  createErrorCollector,
  findContentPathByDisplayName,
  getPreviewFrameText,
} from '../../../helpers/index.js';

const config = loadSiteConfig('nextjs-template');

const TEST_CONTENT = {
  contractDisplayName: process.env.CMS54651_CONTRACT_TEST_DISPLAY_NAME ?? 'CMS54651_MultipleContract',
  arrayDisplayName: process.env.CMS54651_ARRAY_TEST_DISPLAY_NAME ?? 'CMS54651_ContentArea',
};

// Actual field VALUES on the CMS54651PageWithMultipleContracts fixture — checking
// only section labels ("Teaser Contract") isn't enough to prove expandContracts
// resolved the concrete type's properties; the values themselves must render.
const EXPECTED_VALUES = {
  title: process.env.CMS54651_EXPECTED_TITLE ?? 'extend title',
  teaserTitle: process.env.CMS54651_EXPECTED_TEASER_TITLE ?? 'teaser-contract-title',
  teaserDescription: process.env.CMS54651_EXPECTED_TEASER_DESCRIPTION ?? 'teaser-contract-description',
  anotherField: process.env.CMS54651_EXPECTED_ANOTHER_FIELD ?? 'another-contract-field',
};

// ─── Level 2: View mode (navigate to page, verify rendered DOM) ──────────────

test.describe('View — CMS-54651 MultiContract', () => {

  test('contract page renders all properties', async ({ page }) => {
    const lookup = await findContentPathByDisplayName(config, TEST_CONTENT.contractDisplayName);
    expect(
      lookup,
      `No content found with displayName "${TEST_CONTENT.contractDisplayName}" — create the test page or set CMS54651_CONTRACT_TEST_DISPLAY_NAME`,
    ).toBeTruthy();

    await page.goto(`${config.baseUrl}${lookup!.path}`, {
      waitUntil: 'networkidle',
    });

    const body = await page.locator('body').innerText();
    expect(body.length, `Page body is blank (path="${lookup!.path}")`).toBeGreaterThan(50);
    expect(body).not.toContain('Application Error');

    await expect(page.locator('text=Teaser Contract')).toBeVisible();
    await expect(page.locator('text=Another Contract')).toBeVisible();
  });

  test('array page renders child items', async ({ page }) => {
    const lookup = await findContentPathByDisplayName(config, TEST_CONTENT.arrayDisplayName);
    expect(
      lookup,
      `No content found with displayName "${TEST_CONTENT.arrayDisplayName}" — create the test page or set CMS54651_ARRAY_TEST_DISPLAY_NAME`,
    ).toBeTruthy();

    await page.goto(`${config.baseUrl}${lookup!.path}`, {
      waitUntil: 'networkidle',
    });

    const body = await page.locator('body').innerText();
    expect(body.length, `Page body is blank (path="${lookup!.path}")`).toBeGreaterThan(50);

    await expect(page.locator('text=Items')).toBeVisible();
    await expect(page.locator('text=No items')).not.toBeVisible();
  });
});

// ─── Level 3: Edit mode / Preview (CMS UI → getPreviewContent) ──────────────

test.describe('Edit — CMS-54651 MultiContract', () => {

  test('contract page preview renders in edit mode', async ({ page }) => {
    const lookup = await findContentPathByDisplayName(config, TEST_CONTENT.contractDisplayName);
    expect(
      lookup,
      `No content found with displayName "${TEST_CONTENT.contractDisplayName}" — create the test page or set CMS54651_CONTRACT_TEST_DISPLAY_NAME`,
    ).toBeTruthy();

    await loginToCms(page, config);

    const collector = createErrorCollector();

    const editPage = await openContentById(page, config, lookup!.key);
    collector.attach(editPage);

    const { text: previewText, frameUrl } = await getPreviewFrameText(editPage, lookup!.key, 30_000);

    expect(previewText, `"title" (own property) missing/empty. frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_VALUES.title);
    expect(previewText, `"teaserTitle" value missing. frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_VALUES.teaserTitle);
    expect(previewText, `"teaserDescription" value missing. frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_VALUES.teaserDescription);
    expect(previewText, `"anotherField" value missing. frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_VALUES.anotherField);
    expect(previewText).not.toContain('Application Error');
    expect(previewText).not.toContain('500 Internal Server Error');

    expect(collector.errors, 'No critical errors in edit mode').toHaveLength(0);
    collector.detach(editPage);
    await editPage.close();
  });

  test('array page preview renders in edit mode', async ({ page }) => {
    const lookup = await findContentPathByDisplayName(config, TEST_CONTENT.arrayDisplayName);
    expect(
      lookup,
      `No content found with displayName "${TEST_CONTENT.arrayDisplayName}" — create the test page or set CMS54651_ARRAY_TEST_DISPLAY_NAME`,
    ).toBeTruthy();

    await loginToCms(page, config);

    const collector = createErrorCollector();

    const editPage = await openContentById(page, config, lookup!.key);
    collector.attach(editPage);

    const { text: previewText, frameUrl } = await getPreviewFrameText(editPage, lookup!.key, 30_000);
    expect(previewText, `Preview body empty/missing expected text. frameUrl="${frameUrl}"`)
      .toContain('Items');
    expect(previewText, `Nested contract page "title" (own property) missing/empty. frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_VALUES.title);
    expect(previewText, `Nested contract page "teaserTitle" value missing. frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_VALUES.teaserTitle);
    expect(previewText, `Nested contract page "teaserDescription" value missing. frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_VALUES.teaserDescription);
    expect(previewText, `Nested contract page "anotherField" value missing. frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_VALUES.anotherField);
    expect(previewText).not.toContain('Application Error');
    expect(previewText).not.toContain('500 Internal Server Error');

    expect(collector.errors, 'No critical errors in edit mode').toHaveLength(0);
    collector.detach(editPage);
    await editPage.close();
  });
});
