import { Page } from '@playwright/test';
import type { SiteConfig } from './types.js';

/**
 * Navigate to a CMS content item by its numeric ID (edit mode).
 */
export async function openContentById(page: Page, config: SiteConfig, contentId: number): Promise<void> {
  const target = `${config.cmsUrl}/ui/cms#context=epi.cms.contentdata:///${contentId}`;
  if (page.url() !== target) {
    await page.evaluate((url) => { window.location.href = url; }, target);
  }
  await page.waitForTimeout(2000);
}
