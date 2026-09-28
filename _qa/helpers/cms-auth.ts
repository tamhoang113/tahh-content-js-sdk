import { Page } from '@playwright/test';
import type { SiteConfig } from './types.js';

/**
 * Login to Optimizely CMS via Okta.
 * Handles: email step → password step → verify button.
 * Skips if already logged in.
 */
export async function loginToCms(page: Page, config: SiteConfig): Promise<void> {
  await page.goto(`${config.cmsUrl}/ui/cms`);
  await page.waitForLoadState('domcontentloaded');

  if (page.url().includes('/ui/cms')) {
    const title = await page.title();
    if (title.includes('Optimizely CMS')) return;
  }

  // Okta email step
  await page
    .locator('input[type="text"], input[name="identifier"], textbox')
    .first()
    .fill(config.cmsUser);
  await page
    .locator('button:has-text("Next"), button[type="submit"]')
    .first()
    .click();
  await page.waitForLoadState('domcontentloaded');

  // Password step
  await page.locator('input[type="password"]').fill(config.cmsPass);
  await page
    .locator('button:has-text("Verify"), button:has-text("Sign in"), button[type="submit"]')
    .first()
    .click();

  await page.waitForURL(`${config.cmsUrl}/ui/cms**`, { timeout: 15_000 });
  await page.waitForTimeout(1500);
}
