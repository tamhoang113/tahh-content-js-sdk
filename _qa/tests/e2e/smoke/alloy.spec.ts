/**
 * Alloy Smoke Test — Edit Mode + View Mode
 *
 * Run:
 *   pnpm test:e2e:smoke:alloy
 *   pnpm test:e2e -- --headed --grep "Alloy"
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadSiteConfig,
  loginToCms,
  openContentById,
  createErrorCollector,
  fetchSitePages,
  checkPageViewMode,
  type SiteConfig,
  type CmsPage,
  type PageCheckResult,
} from '../../../helpers/index.js';

const config: SiteConfig = loadSiteConfig('alloy');

// TODO: populate with actual content IDs after site setup
const ALLOY_CMS_IDS: Record<string, number> = {
  // 'Alloy (Start)': 6,
};

// ─── Edit Mode ───────────────────────────────────────────────────────────────

test.describe('Edit Mode — Alloy', () => {
  test.setTimeout(300_000);

  test.skip(
    Object.keys(ALLOY_CMS_IDS).length === 0,
    'No content IDs configured — populate ALLOY_CMS_IDS first',
  );

  test('login to CMS', async ({ page }) => {
    await loginToCms(page, config);
    expect(page.url()).toContain('/ui/cms');
  });

  for (const [pageName, cmsId] of Object.entries(ALLOY_CMS_IDS)) {
    test(`[Edit] ${pageName} (id=${cmsId})`, async ({ page }) => {
      await loginToCms(page, config);

      const collector = createErrorCollector();
      collector.attach(page);

      await openContentById(page, config, cmsId);

      const bodyText = await page.locator('body').innerText().catch(() => '');
      expect(bodyText).not.toContain('Application Error');
      expect(bodyText).not.toContain('500 Internal Server Error');

      expect(
        collector.errors,
        `Critical errors on ${pageName} (id=${cmsId})`,
      ).toHaveLength(0);

      collector.detach(page);
    });
  }
});

// ─── View Mode ───────────────────────────────────────────────────────────────

test.describe('View Mode — Alloy', () => {
  test.setTimeout(300_000);

  let pages: CmsPage[] = [];

  test.beforeAll(async () => {
    pages = await fetchSitePages(config);
    console.log(`Found ${pages.length} Alloy pages via Graph API`);
  });

  test('all pages — HTTP 200, not blank, no errors', async ({ page }) => {
    test.skip(pages.length === 0, 'No pages found via Graph API');

    const results: PageCheckResult[] = [];

    for (const cmsPage of pages) {
      const viewUrl = `${config.baseUrl}${cmsPage.url}`;
      const result = await checkPageViewMode(page, viewUrl, cmsPage.name);
      results.push(result);

      const icon = result.status === 'OK' ? '✅' : '❌';
      console.log(`${icon} ${cmsPage.name} ${cmsPage.url} — ${result.status}`);
    }

    const reportDir = path.join(__dirname, '..', '..', '..', 'qa-reports');
    fs.mkdirSync(reportDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(
      path.join(reportDir, `alloy-smoke-${ts}.json`),
      JSON.stringify(results, null, 2),
    );

    const failed = results.filter(r => r.status !== 'OK');
    if (failed.length > 0) {
      const summary = failed
        .map(r => `  • ${r.page}: ${r.status} ${r.errors.join('; ')}`)
        .join('\n');
      expect.soft(false, `${failed.length} pages failed:\n${summary}`).toBeTruthy();
    }
  });
});
