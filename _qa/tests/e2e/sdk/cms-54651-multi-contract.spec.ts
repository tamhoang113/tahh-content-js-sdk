/**
 * CMS-54651: Multi-Contract Content Type — View + Edit Mode (Playwright)
 *
 * Browser-level tests that verify rendered pages and CMS edit mode.
 * SDK API tests are in tests/sdk/cms-54651-multi-contract.test.ts (vitest).
 *
 * Prerequisites:
 *   1. Content types pushed + test content created + indexed to Graph
 *   2. Dev server running:  cd templates/stride && pnpm dev
 *
 * Run:
 *   pnpm test:e2e -- --grep "CMS-54651"
 *   pnpm test:e2e -- --grep "View" --headed
 *   pnpm test:e2e -- --grep "Edit" --headed
 */

import { test, expect } from '@playwright/test';
import {
  loadSiteConfig,
  loginToCms,
  openContentById,
  createErrorCollector,
} from '../../../helpers/index.js';

const config = loadSiteConfig('stride');

const TEST_CONTENT = {
  contractPagePath: '/en/cms54651-page-with-multiple-contracts',
  arrayPagePath: '/en/cms54651-page-with-content-array',
  // CMS content IDs (for edit mode tests) — find in CMS URL hash
  // contractPageId: 25,
  // arrayPageId: 26,
};

// ─── Level 2: View mode (navigate to page, verify rendered DOM) ──────────────

test.describe('View — CMS-54651 MultiContract', () => {

  test('contract page renders all properties', async ({ page }) => {
    await page.goto(`${config.baseUrl}${TEST_CONTENT.contractPagePath}`, {
      waitUntil: 'networkidle',
    });

    const body = await page.locator('body').innerText();
    expect(body.length, 'Page body is blank').toBeGreaterThan(50);
    expect(body).not.toContain('Application Error');

    await expect(page.locator('text=Teaser Contract')).toBeVisible();
    await expect(page.locator('text=Another Contract')).toBeVisible();
  });

  test('array page renders child items', async ({ page }) => {
    await page.goto(`${config.baseUrl}${TEST_CONTENT.arrayPagePath}`, {
      waitUntil: 'networkidle',
    });

    const body = await page.locator('body').innerText();
    expect(body.length, 'Page body is blank').toBeGreaterThan(50);

    await expect(page.locator('text=Items')).toBeVisible();
    await expect(page.locator('text=No items')).not.toBeVisible();
  });
});

// ─── Level 3: Edit mode / Preview (CMS UI → getPreviewContent) ──────────────

test.describe('Edit — CMS-54651 MultiContract', () => {
  // Uncomment and set content IDs after creating test content
  // const CONTRACT_PAGE_ID = 25;
  // const ARRAY_PAGE_ID = 26;

  test.skip(true, 'Set content IDs (CONTRACT_PAGE_ID, ARRAY_PAGE_ID) after creating test data');

  test('contract page preview renders in edit mode', async ({ page }) => {
    await loginToCms(page, config);

    const collector = createErrorCollector();
    collector.attach(page);

    // await openContentById(page, config, CONTRACT_PAGE_ID);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    expect(bodyText).not.toContain('Application Error');
    expect(bodyText).not.toContain('500 Internal Server Error');

    expect(collector.errors, 'No critical errors in edit mode').toHaveLength(0);
    collector.detach(page);
  });
});
