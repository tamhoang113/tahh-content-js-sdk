import { test, expect } from '@playwright/test';
import { loadSiteConfig, ensureStoryFixtures, resolveTestContainer } from '../../../helpers/index.js';
import { CMS_57435 } from '../../../fixtures/cms-57435.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer();

let fixtures: Awaited<ReturnType<typeof ensureStoryFixtures<typeof CMS_57435>>>;

test.describe('CMS-57435: contentReference image metadata in browser', () => {
  test.skip(!container, 'CMS_TEST_CONTAINER not set');

  test.beforeAll(async () => {
    fixtures = await ensureStoryFixtures(config, CMS_57435, { container });
  });

  test('imageRef renders with valid image src and metadata available', async ({ page }) => {
    await page.goto(`${config.baseUrl}${fixtures.pageWithImageRef.path}`);
    await page.waitForLoadState('networkidle');

    const badge = page.locator('div').filter({ hasText: /PageContentRefProperty/i }).first();
    await expect(badge).toBeVisible({ timeout: 10_000 });

    const img = page.locator('tr[data-property="imageRef"] img');
    await expect(img).toBeVisible();

    const src = await img.getAttribute('src');
    expect(src, 'imageRef should have a src').toBeTruthy();
    expect(src).toContain('/globalassets/');
  });
});
