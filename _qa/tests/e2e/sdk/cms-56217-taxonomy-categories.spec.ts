/**
 * CMS-56217: Taxonomy categories support — View + Edit Mode (Playwright)
 *
 * Browser-level counterpart of tests/sdk/cms-56217-taxonomy-categories.test.ts
 * (vitest). The SDK test verifies the JSON data contract (getContentByPath);
 * this file verifies the content actually RENDERS — in view mode (public page)
 * and in CMS edit mode (preview iframe → getPreviewContent).
 *
 * Fixture-driven, exactly like the SDK test: nothing here is hardcoded. The
 * cases, their display names, and their expected category counts all come from
 * the single source of truth in `_qa/fixtures/cms-56217.ts`. `ensureStoryFixtures`
 * provisions (or just resolves) the data and hands back a real `key`/`path` per
 * case, so tests open pages by resolved id/path — never a literal GUID or URL.
 *
 * Prerequisites:
 *   1. Content types pushed: cd samples/nextjs-template && npx @optimizely/cms-cli config push
 *   2. CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_56217) = a parent container GUID
 *   3. Dev server running:   cd samples/nextjs-template && pnpm dev
 *
 * Run:
 *   pnpm test:e2e -- --grep "CMS-56217"
 *   pnpm test:e2e -- --grep "View — CMS-56217" --headed
 *   pnpm test:e2e -- --grep "Edit — CMS-56217" --headed
 *
 * If CMS_TEST_CONTAINER is unset the whole suite is skipped (CI without a seeded
 * site stays green) — same policy as the SDK test's describe.skipIf.
 */

import { test, expect } from '@playwright/test';
import {
  loadSiteConfig,
  loginToCms,
  openContentById,
  createErrorCollector,
  getPreviewFrameText,
  ensureStoryFixtures,
  resolveTestContainer,
} from '../../../helpers/index.js';
import type { ResolvedFixture } from '../../../helpers/index.js';
import { CMS_56217, type CMS56217CaseId } from '../../../fixtures/cms-56217.js';

const config = loadSiteConfig('nextjs-template');
const container = resolveTestContainer(CMS_56217.ticket);

// Resolve the fixtures ONCE for the whole file (shared across view + edit specs).
// ensureStoryFixtures is idempotent: it resolves each case by its display name
// (== automationId) and only imports the package if a case is missing.
let fixtures: Record<CMS56217CaseId, ResolvedFixture>;

test.beforeAll(async () => {
  if (!container) return; // suite is skipped below; don't provision
  fixtures = await ensureStoryFixtures(config, CMS_56217, { container });
});

// Case ids come straight from the fixture catalog — adding a case there makes it
// appear here automatically, no edits to this file.
const caseIds = Object.keys(CMS_56217.cases) as CMS56217CaseId[];

// ─── Level 2: View mode (navigate to resolved path, verify rendered DOM) ─────

test.describe('View — CMS-56217 Taxonomy', () => {
  test.skip(!container, 'CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_56217) not set');

  for (const caseId of caseIds) {
    const def = CMS_56217.cases[caseId];
    const expectedCount = (def.expected?.rawCategoryCount as number) ?? 0;

    test(`${def.automationId} renders with ${expectedCount} raw categor${expectedCount === 1 ? 'y' : 'ies'}`, async ({ page }) => {
      const resolved = fixtures[caseId];
      expect(resolved, `fixture "${caseId}" was not resolved`).toBeTruthy();

      // Open the page by the RESOLVED path (not a hardcoded URL).
      await page.goto(`${config.baseUrl}${resolved.path}`, { waitUntil: 'networkidle' });

      const body = await page.locator('body').innerText();
      expect(body.length, `Page body is blank (path="${resolved.path}")`).toBeGreaterThan(50);
      expect(body).not.toContain('Application Error');

      // Title (required property) must render as the page heading.
      await expect(page.locator('h1')).not.toBeEmpty();

      // The property table always renders a row for _metadata.categories.
      const rawRow = page.locator('tr[data-property="_metadata.categories"]');
      await expect(rawRow).toBeVisible();

      // Category presence is driven by the fixture's expected count — proving the
      // SDK surfaced _metadata.categories into the rendered DOM.
      if (expectedCount > 0) {
        await expect(rawRow.getByText('No categories assigned')).toHaveCount(0);
        await expect(rawRow.locator('ul > li')).toHaveCount(expectedCount);
      } else {
        await expect(rawRow.getByText('No categories assigned')).toBeVisible();
      }
    });
  }
});

// ─── Level 3: Edit mode / Preview (CMS UI → getPreviewContent) ───────────────

test.describe('Edit — CMS-56217 Taxonomy', () => {
  test.skip(!container, 'CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_56217) not set');

  for (const caseId of caseIds) {
    const def = CMS_56217.cases[caseId];
    const expectedCount = (def.expected?.rawCategoryCount as number) ?? 0;

    test(`${def.automationId} preview renders in edit mode`, async ({ page }) => {
      const resolved = fixtures[caseId];
      expect(resolved, `fixture "${caseId}" was not resolved`).toBeTruthy();

      await loginToCms(page, config);

      const collector = createErrorCollector();
      collector.attach(page);

      // Open the item in CMS edit mode by its RESOLVED key (not a hardcoded GUID).
      await openContentById(page, config, resolved.key);

      // Preview content verification is a HARD requirement — do NOT wrap in
      // try/catch; a slow iframe must surface as a real failure, not be swallowed.
      const { text: previewText, frameUrl } = await getPreviewFrameText(page, resolved.key, 30_000);

      expect(previewText, `Preview body empty/missing property table. frameUrl="${frameUrl}"`)
        .toContain('_metadata.categories');

      if (expectedCount > 0) {
        expect(previewText, `Expected ${expectedCount} categories but "No categories assigned" shown. frameUrl="${frameUrl}"`)
          .not.toContain('No categories assigned');
      } else {
        expect(previewText, `Expected empty-category state. frameUrl="${frameUrl}"`)
          .toContain('No categories assigned');
      }

      expect(previewText).not.toContain('Application Error');
      expect(previewText).not.toContain('500 Internal Server Error');

      expect(collector.errors, 'No critical errors in edit mode').toHaveLength(0);
      collector.detach(page);
    });
  }
});
