import { Page } from '@playwright/test';
import type { SiteConfig } from './types.js';

/**
 * Graph returns content `key` as a plain 32-char hex string (no dashes), but
 * the CMS edit UI's contentdata context route requires the standard dashed
 * GUID format (8-4-4-4-12). Passing the dashless form silently fails to
 * resolve and falls back to a default/unrelated content item (e.g. the site
 * root) instead of erroring — so this must always be applied before building
 * the navigation URL.
 */
function toDashedGuid(id: string): string {
  const hex = id.replace(/-/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) return id; // not a plain GUID (e.g. numeric ID) — leave as-is
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Pre-grant Chrome's Local Network Access permission for the CMS origin so the
 * embedded sitePreview iframe (localhost:3001) doesn't get blocked behind the
 * "wants to: Access other apps and services on this device" native prompt,
 * which a headless-controlled context has no way to click.
 *
 * The disable-features flags in playwright.config.ts try to prevent the prompt
 * from appearing at all, but they only cover known feature names — different
 * Chrome builds gate the prompt behind different flag names. This function
 * pre-grants the permission via CDP as an authoritative override that works
 * even when the underlying feature flag hasn't been reliably identified.
 *
 * Best-effort: swallow errors (e.g. older Chrome without this permission type)
 * so this never becomes a new failure mode of its own.
 */
async function grantLocalNetworkAccess(page: Page, cmsUrl: string): Promise<void> {
  try {
    const origin = new URL(cmsUrl).origin;
    const cdp = await page.context().newCDPSession(page);
    // Try both known permission names — Chrome renamed this over versions.
    for (const permission of ['localNetworkAccess', 'privateNetworkAccess']) {
      try {
        await cdp.send('Browser.grantPermissions', {
          origin,
          permissions: [permission],
        } as any);
      } catch {
        // permission not recognized by this Chrome build — try the other
      }
    }
    await cdp.detach().catch(() => {});
  } catch {
    // never let permission bootstrapping fail the test itself
  }
}

/**
 * Navigate to a CMS content item by its numeric ID or GUID key (edit mode).
 * Accepts either a numeric content ID or a content key (GUID) — both are
 * valid ContentReference identifiers, so this works with the `key` returned
 * by findContentPathByDisplayName/getContentByDisplayName, avoiding the need
 * to hardcode a content ID.
 *
 * IMPORTANT — call ONLY after loginToCms(page, config) has already completed.
 * If the page isn't authenticated yet, this URL's hash fragment
 * (#context=epi.cms.contentdata:///{id}) gets silently dropped during the
 * Okta OAuth redirect round-trip (browsers don't send the hash through
 * navigation/redirects), and the app falls back to a default page (e.g. site
 * root, content ID 6) instead of the requested one. Always: loginToCms()
 * first (plain /ui/cms URL, no hash), then openContentById() second.
 */
export async function openContentById(page: Page, config: SiteConfig, contentId: number | string): Promise<void> {
  // Pre-authorize Local Network Access for the CMS origin so the sitePreview
  // iframe can talk to localhost:3001 without triggering Chrome's native
  // permission prompt (which automated contexts have no way to dismiss).
  await grantLocalNetworkAccess(page, config.cmsUrl);

  const id = typeof contentId === 'string' ? toDashedGuid(contentId) : contentId;
  const target = `${config.cmsUrl}/ui/cms#context=epi.cms.contentdata:///${id}`;
  if (page.url() !== target) {
    await page.evaluate((url) => { window.location.href = url; }, target);
  }
  // Wait for the CMS edit shell to finish its initial load. Precise waiting
  // for the preview iframe itself (name="sitePreview") is handled separately
  // by waitForPreviewFrame/getPreviewFrameText — callers that need preview
  // content should use those instead of relying on a fixed sleep here.
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}
