import { test, expect } from '@playwright/test';
import { loadSiteConfig, ensureStoryFixtures, resolveTestContainer } from '../../../helpers/index.js';
import { CMS_58169 } from '../../../fixtures/cms-58169.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer();

let fixtures: Awaited<ReturnType<typeof ensureStoryFixtures<typeof CMS_58169>>>;

test.describe('CMS-58169: Preview media token retry', () => {
  test.skip(!container, 'CMS_TEST_CONTAINER not set');

  test.beforeAll(async () => {
    fixtures = await ensureStoryFixtures(config, CMS_58169, { container });
  });

  test('imageRef src does NOT contain preview_token and renders correctly', async ({ page }) => {
    await page.goto(`${config.baseUrl}${fixtures.pageWithImage.path}`);
    await page.waitForLoadState('networkidle');

    // Page renders without errors
    const badge = page.locator('div').filter({ hasText: /PageContentRefProperty/i }).first();
    await expect(badge).toBeVisible({ timeout: 10_000 });

    // imageRef img exists with correct CMS asset URL, no preview_token
    const img = page.locator('tr[data-property="imageRef"] img');
    await expect(img).toBeVisible();

    const src = await img.getAttribute('src');
    expect(src, 'imageRef should have a src').toBeTruthy();
    expect(src).toContain('/globalassets/');
    expect(src).not.toContain('preview_token');
  });
});
