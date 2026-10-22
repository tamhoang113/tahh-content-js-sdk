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

  // Use role-based locator: Okta's submit control isn't always a native
  // <button> (can be <input type="submit"> or a custom element), so a tag-based
  // CSS selector like `button:has-text(...)` can match 0 elements even though
  // it's clearly visible on screen. getByRole resolves via the accessibility
  // tree (implicit ARIA role), which works regardless of the underlying tag.
  await page.getByRole('button', { name: /Next/i }).click();
  await page.waitForLoadState('domcontentloaded');

  // Password step
  await page.locator('input[type="password"]').fill(config.cmsPass);
  await page.getByRole('button', { name: /Verify|Sign in/i }).click();

  await page.waitForURL(`${config.cmsUrl}/ui/cms**`, { timeout: 15_000 });

  // Wait for the CMS SPA to finish its initial default navigation. After the
  // OAuth redirect lands on /ui/cms, the SPA is still bootstrapping and will
  // shortly push #context=epi.cms.contentdata:///6 (or similar default content)
  // to the URL. Callers that immediately call openContentById() would have their
  // navigation overwritten by this. Waiting for the hash to appear means the SPA
  // has settled and is ready to accept a new hash navigation.
  await page.waitForURL(/ui\/cms#context=/, { timeout: 15_000 }).catch(() => {});
}
