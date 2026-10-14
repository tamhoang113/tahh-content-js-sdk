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
  waitForPreviewFrame,
  ensureStoryFixtures,
  resolveTestContainer,
} from '../../../helpers/index.js';
import type { ResolvedFixture } from '../../../helpers/index.js';
import { CMS_56217, type CMS56217CaseId } from '../../../fixtures/cms-56217.js';

const config = loadSiteConfig('nextjs-template');
const container = resolveTestContainer(CMS_56217.ticket);

let fixtures: Record<CMS56217CaseId, ResolvedFixture>;

const caseIds = Object.keys(CMS_56217.cases) as CMS56217CaseId[];

// ─── Level 2: View mode (navigate to resolved path, verify rendered DOM) ─────

test.describe('View — CMS-56217 Taxonomy', () => {
  test.skip(!container, 'CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_56217) not set');

  test.beforeAll(async () => {
    if (!container) return;
    fixtures = await ensureStoryFixtures(config, CMS_56217, { container });
  });

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

      if (expectedCount > 0) {
        await expect(rawRow.getByText('No categories assigned')).toHaveCount(0);
        const items = rawRow.locator('ul > li');
        await expect(items).toHaveCount(expectedCount);

        // Verify each rendered category URI contains the expected term key
        const assignedTerms = def.categories as string[];
        for (const termKey of assignedTerms) {
          await expect(
            rawRow.locator('ul > li', { hasText: termKey }),
            `category list should contain term "${termKey}"`,
          ).toHaveCount(1);
        }
      } else {
        await expect(rawRow.getByText('No categories assigned')).toBeVisible();
      }

      // Verify title renders with exact fixture value
      const titleText = await page.locator('h1').innerText();
      expect(titleText).toContain(def.properties.title as string);

      // For hierarchical case: verify resolvedCategories renders key + full path breadcrumb
      if ((def.expected as any)?.hasHierarchy) {
        const resolvedRow = page.locator('tr[data-property="_metadata.resolvedCategories"]');
        await expect(resolvedRow).toBeVisible();

        const resolvedText = await resolvedRow.innerText();
        const expectedTermKeys = (def.expected as any).resolvedTermKeys as string[];
        const expectedDisplayName = (def.expected as any).resolvedDisplayName as string;
        const hierarchyPath = (def.expected as any).hierarchyPath as Array<{ key: string; displayName: string }>;

        // Verify resolved category key and displayName
        for (const termKey of expectedTermKeys) {
          expect(resolvedText, `resolvedCategories should show key "${termKey}"`)
            .toContain(termKey);
        }
        expect(resolvedText, `resolvedCategories should show displayName "${expectedDisplayName}"`)
          .toContain(expectedDisplayName);

        // Verify full hierarchy path from fixture
        for (const node of hierarchyPath) {
          expect(resolvedText, `path should contain node key "${node.key}"`)
            .toContain(node.key);
          expect(resolvedText, `path should contain node displayName "${node.displayName}"`)
            .toContain(node.displayName);
        }

        // Path depth matches fixture
        expect(resolvedText).toContain(`Path (${hierarchyPath.length})`);
      }
    });
  }
});

// ─── Level 3: Edit mode / Preview (CMS UI → getPreviewContent) ───────────────

test.describe('Edit — CMS-56217 Taxonomy', () => {
  test.skip(!container, 'CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_56217) not set');

  test.beforeAll(async () => {
    if (!container) return;
    fixtures = await ensureStoryFixtures(config, CMS_56217, { container });
  });

  for (const caseId of caseIds) {
    const def = CMS_56217.cases[caseId];
    const expectedCount = (def.expected?.rawCategoryCount as number) ?? 0;

    test(`${def.automationId} preview renders in edit mode`, async ({ page }) => {
      const resolved = fixtures[caseId];
      expect(resolved, `fixture "${caseId}" was not resolved`).toBeTruthy();

      await loginToCms(page, config);

      const collector = createErrorCollector();
      collector.attach(page);

      await openContentById(page, config, resolved.key);

      // Get the preview iframe as a Frame, then use locators for precise assertions
      const frame = await waitForPreviewFrame(page, 30_000);
      await frame.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
      await frame.locator('body').waitFor({ state: 'visible', timeout: 10_000 });

      // Verify no application errors
      const body = frame.locator('body');
      await expect(body).not.toContainText('Application Error');
      await expect(body).not.toContainText('500 Internal Server Error');

      // Verify title in h1
      const h1 = frame.locator('h1');
      await expect(h1).toContainText(def.properties.title as string);

      // ─── _metadata.categories row ────────────────────────────────────
      const rawRow = frame.locator('tr[data-property="_metadata.categories"]');
      await expect(rawRow).toBeVisible();

      if (expectedCount > 0) {
        await expect(rawRow.getByText('No categories assigned')).toHaveCount(0);
        await expect(rawRow.locator('ul > li')).toHaveCount(expectedCount);

        const assignedTerms = def.categories as string[];
        for (const termKey of assignedTerms) {
          await expect(
            rawRow.locator('ul > li', { hasText: termKey }),
            `edit: category list should contain term "${termKey}"`,
          ).toHaveCount(1);
        }
      } else {
        await expect(rawRow.getByText('No categories assigned')).toBeVisible();
      }

      // ─── _metadata.resolvedCategories row (hierarchical case) ────────
      if ((def.expected as any)?.hasHierarchy) {
        const resolvedRow = frame.locator('tr[data-property="_metadata.resolvedCategories"]');
        await expect(resolvedRow).toBeVisible();

        const expectedTermKeys = (def.expected as any).resolvedTermKeys as string[];
        const expectedDisplayName = (def.expected as any).resolvedDisplayName as string;
        const hierarchyPath = (def.expected as any).hierarchyPath as Array<{ key: string; displayName: string }>;

        // Verify resolved category key rendered in the Key: line
        for (const termKey of expectedTermKeys) {
          await expect(
            resolvedRow.getByText(`Key: ${termKey}`),
            `edit: resolvedCategories should show Key: ${termKey}`,
          ).toBeVisible();
        }

        // Verify displayName rendered as bold heading
        await expect(
          resolvedRow.locator('div', { hasText: expectedDisplayName }).first(),
          `edit: resolvedCategories should show displayName "${expectedDisplayName}"`,
        ).toBeVisible();

        // Verify path depth
        await expect(
          resolvedRow.getByText(`Path (${hierarchyPath.length})`),
          `edit: path depth should be ${hierarchyPath.length}`,
        ).toBeVisible();

        // Verify each path node rendered as ordered list items
        const pathItems = resolvedRow.locator('ol ol > li');
        await expect(pathItems).toHaveCount(hierarchyPath.length);

        for (let i = 0; i < hierarchyPath.length; i++) {
          const item = pathItems.nth(i);
          await expect(item).toContainText(hierarchyPath[i].displayName);
          await expect(item).toContainText(`(${hierarchyPath[i].key})`);
        }
      }

      expect(collector.errors, 'No critical errors in edit mode').toHaveLength(0);
      collector.detach(page);
    });
  }
});
