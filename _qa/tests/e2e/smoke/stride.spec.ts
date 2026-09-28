/**
 * Stride Smoke Test — Edit Mode + View Mode
 *
 * Checks all pages under the Stride start page for errors.
 *
 * Run:
 *   pnpm test:e2e:smoke:stride
 *   pnpm test:e2e -- --headed --grep "Edit Mode"
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

const config: SiteConfig = loadSiteConfig('stride');

// Known content IDs in Stride content tree
const STRIDE_CMS_IDS: Record<string, number> = {
  'Stride (Start)':     6,
  'Features':           7,
  'Challenges':         8,
  'Subscriptions':      9,
  'About Us':           10,
  'News & Events':      11,
  'Events':             12,
  'Summit 2026':        13,
  'Community Marathon':  14,
  'News':               15,
  'Series B':           16,
  'Stride Stats':       17,
  'Top 10':             18,
};

// ─── Edit Mode ───────────────────────────────────────────────────────────────

test.describe('Edit Mode — Stride', () => {
  test.setTimeout(300_000);

  test('login to CMS', async ({ page }) => {
    await loginToCms(page, config);
    expect(page.url()).toContain('/ui/cms');
  });

  for (const [pageName, cmsId] of Object.entries(STRIDE_CMS_IDS)) {
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

test.describe('View Mode — Stride', () => {
  test.setTimeout(300_000);

  let pages: CmsPage[] = [];

  test.beforeAll(async () => {
    pages = await fetchSitePages(config);
    console.log(`Found ${pages.length} Stride pages via Graph API`);
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

    // Save report
    const reportDir = path.join(__dirname, '..', '..', '..', 'qa-reports');
    fs.mkdirSync(reportDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(
      path.join(reportDir, `stride-smoke-${ts}.json`),
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
