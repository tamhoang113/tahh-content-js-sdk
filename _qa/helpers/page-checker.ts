import { Page } from '@playwright/test';
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
 * Create an error collector that listens for console errors and page crashes.
 * Filters out known platform noise.
 */
export function createErrorCollector(): ErrorCollector {
  const errors: string[] = [];

  const consoleListener = (msg: any) => {
    if (msg.type() === 'error' && !isIgnoredError(msg.text()) && !isTransientError(msg.text())) {
      errors.push(msg.text());
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
      page.on('pageerror', crashListener);
    },
    detach(page: Page) {
      page.off('console', consoleListener);
      page.off('pageerror', crashListener);
    },
  };
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
