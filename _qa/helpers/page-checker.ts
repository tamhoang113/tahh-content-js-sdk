import { Page, Frame } from '@playwright/test';
import type { PageCheckResult } from './types.js';

const IGNORED_ERRORS = [
  '/api/cms/extensions',
  'roboto-condensed-latin-wght-normal.woff2',
];

const TRANSIENT_ERRORS = [
  'removeChild',
];

function isIgnoredError(msg: string): boolean {
  return IGNORED_ERRORS.some(p => msg.includes(p));
}

function isTransientError(msg: string): boolean {
  return TRANSIENT_ERRORS.some(p => msg.includes(p));
}

export interface ErrorCollector {
  errors: string[];
  attach: (page: Page) => void;
  detach: (page: Page) => void;
}

/**
 * Create an error collector that listens for console errors, page crashes,
 * and failed HTTP responses (4xx/5xx). Filters out known platform noise.
 *
 * Note: a browser-level "Failed to load resource: ... 404" console message
 * does NOT include the failing URL in its text (Chrome logs it generically),
 * so matching IGNORED_ERRORS against console text alone can never filter it
 * out even when the URL matches a known-noise pattern. Listening to the
 * `response` event instead gives us the real URL to filter against.
 */
export function createErrorCollector(): ErrorCollector {
  const errors: string[] = [];

  const consoleListener = (msg: any) => {
    // Generic "Failed to load resource" messages carry no URL and are already
    // covered by the response listener below (which can actually filter them
    // by URL) — skip here to avoid double-counting/un-filterable duplicates.
    if (msg.type() === 'error' && !/^Failed to load resource:/.test(msg.text())
      && !isIgnoredError(msg.text()) && !isTransientError(msg.text())) {
      errors.push(msg.text());
    }
  };

  const responseListener = (res: any) => {
    const status = res.status();
    if (status >= 400) {
      const url = res.url();
      if (!isIgnoredError(url) && !isTransientError(url)) {
        errors.push(`HTTP ${status}: ${url}`);
      }
    }
  };

  const crashListener = (err: Error) => {
    if (!isIgnoredError(err.message) && !isTransientError(err.message)) {
      errors.push(`[pageerror] ${err.message}`);
    }
  };

  return {
    errors,
    attach(page: Page) {
      page.on('console', consoleListener);
      page.on('response', responseListener);
      page.on('pageerror', crashListener);
    },
    detach(page: Page) {
      page.off('console', consoleListener);
      page.off('response', responseListener);
      page.off('pageerror', crashListener);
    },
  };
}

/**
 * Collect the innerText of `body` across the main page AND every child frame,
 * concatenated. CMS edit-mode preview content is often rendered inside an
 * iframe (the live site embedded in the admin shell) — `page.locator('body')`
 * alone only sees the main frame, so a check against it can pass even when
 * the preview iframe shows a completely different/wrong page. Use this when
 * you need to assert on preview content specifically.
 */
export async function getAllFramesText(page: Page): Promise<string> {
  const texts = await Promise.all(
    page.frames().map(async (frame) => {
      try {
        return await frame.locator('body').innerText({ timeout: 3000 });
      } catch {
        return '';
      }
    }),
  );
  return texts.join('\n');
}

/**
 * CMS edit mode embeds the live site preview in an iframe whose src is
 * `{APPLICATION_HOST}/preview?key={contentKey}&...`. Historically the iframe
 * carried `name="sitePreview"`, but newer editor views (e.g. On-Page Editing
 * vs Visual Builder) or CMS versions may drop/rename that attribute. Match
 * on the URL pattern (`/preview?key=`) instead — it's the stable contract
 * for what makes a frame "the preview", regardless of DOM attributes.
 *
 * Polling this specific frame is far more precise/faster than a blind fixed
 * sleep or scanning every frame — the CMS shell's own frames (main frame,
 * Okta discovery iframe, etc.) render immediately, while this one is only
 * created once the preview panel actually starts loading.
 */
export async function waitForPreviewFrame(page: Page, timeoutMs = 20_000): Promise<Frame> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const frame = page.frames().find((f) => /\/preview\?key=/.test(f.url()));
    if (frame) return frame;
    await page.waitForTimeout(300);
  }
  const seen = page.frames().map((f) => `${f.name() || '(no name)'}=${f.url() || '(no url)'}`).join(' | ');
  throw new Error(
    `Preview iframe (src matching /preview?key=) did not appear within ${timeoutMs}ms. Frames seen: ${seen}`,
  );
}

/**
 * Wait for the preview iframe to exist, verify its URL is actually for the
 * expected content key (the most reliable "are we on the right page?" check
 * — the iframe src is `{APPLICATION_HOST}/preview?key={contentKey}&...`, set
 * synchronously when the frame is created, unlike rendered body text which
 * can take a while and race with reads), then poll for its rendered body text
 * to become non-empty.
 */
export async function getPreviewFrameText(
  page: Page,
  expectedContentKey?: string,
  timeoutMs = 20_000,
): Promise<{ text: string; frameUrl: string }> {
  const frame = await waitForPreviewFrame(page, timeoutMs);
  const frameUrl = frame.url();

  if (expectedContentKey) {
    const expectedKeyDashless = expectedContentKey.replace(/-/g, '');
    if (!frameUrl.includes(expectedKeyDashless)) {
      throw new Error(
        `Preview iframe URL does not reference the expected content key. Expected key "${expectedContentKey}" in URL, got: ${frameUrl}`,
      );
    }
  }

  await frame.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => {});

  const start = Date.now();
  let text = '';
  while (Date.now() - start < timeoutMs) {
    text = await frame.locator('body').innerText({ timeout: 3000 }).catch(() => '');
    if (text.trim().length > 0) break;
    await page.waitForTimeout(500);
  }
  return { text, frameUrl };
}

/**
 * Check a page in view mode: navigate, verify HTTP status, body content, console errors.
 */
export async function checkPageViewMode(
  page: Page,
  url: string,
  pageName: string,
): Promise<PageCheckResult> {
  const collector = createErrorCollector();
  collector.attach(page);

  let httpStatus = 0;
  let bodyLength = 0;

  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
    httpStatus = res?.status() ?? 0;
    await page.waitForTimeout(500);
    const text = await page.locator('body').innerText().catch(() => '');
    bodyLength = text.trim().length;
  } catch (e) {
    collector.detach(page);
    return {
      page: pageName,
      url,
      status: 'NAV_ERROR',
      errors: [`Navigation error: ${(e as Error).message}`],
    };
  }

  collector.detach(page);

  const status: PageCheckResult['status'] =
    httpStatus >= 400 ? 'HTTP_ERROR' :
    bodyLength < 50   ? 'BLANK'      :
    collector.errors.length > 0 ? 'HAS_ERRORS' :
    'OK';

  return {
    page: pageName,
    url,
    status,
    httpStatus,
    errors: [...collector.errors],
  };
}
