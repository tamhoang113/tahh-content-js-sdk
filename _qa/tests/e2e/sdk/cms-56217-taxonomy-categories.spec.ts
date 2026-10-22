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

      // Verify title renders with exact fixture value
      const titleCell = page.locator('tr[data-property="title"] td[data-col="value"]');
      await expect(titleCell).toContainText(def.properties.title as string);

      // ─── _metadata.categories — locate value cell precisely ──────────
      const rawValueCell = page.locator('tr[data-property="_metadata.categories"] td[data-col="value"]');
      await expect(rawValueCell).toBeVisible();

      if (expectedCount > 0) {
        await expect(rawValueCell.getByText('No categories assigned')).toHaveCount(0);
        await expect(rawValueCell.locator('ul > li')).toHaveCount(expectedCount);

        const assignedTerms = def.categories as string[];
        for (const termKey of assignedTerms) {
          await expect(
            // Use exact regex match — { hasText: 'Taxanomy' } is a substring match
            // and would also match 'Taxanomy_Internal', returning 2 elements.
            rawValueCell.locator('ul > li').filter({ hasText: new RegExp(`^${termKey}$`) }),
            `category list should contain term "${termKey}"`,
          ).toHaveCount(1);
        }
      } else {
        await expect(rawValueCell.getByText('No categories assigned')).toBeVisible();
      }

      // ─── _metadata.resolvedCategories — hierarchical case ────────────
      if ((def.expected as any)?.hasHierarchy) {
        const resolvedValueCell = page.locator('tr[data-property="_metadata.resolvedCategories"] td[data-col="value"]');
        await expect(resolvedValueCell).toBeVisible();

        const expectedTermKeys = (def.expected as any).resolvedTermKeys as string[];
        const expectedDisplayName = (def.expected as any).resolvedDisplayName as string;
        const hierarchyPath = (def.expected as any).hierarchyPath as Array<{ key: string; displayName: string }>;

        for (const termKey of expectedTermKeys) {
          await expect(
            resolvedValueCell.getByText(`Key: ${termKey}`),
            `resolvedCategories should show Key: ${termKey}`,
          ).toBeVisible();
        }
        await expect(resolvedValueCell.locator('div', { hasText: expectedDisplayName }).first())
          .toBeVisible();

        await expect(resolvedValueCell.getByText(`Path (${hierarchyPath.length})`)).toBeVisible();

        const pathItems = resolvedValueCell.locator('ol ol > li');
        await expect(pathItems).toHaveCount(hierarchyPath.length);
        for (let i = 0; i < hierarchyPath.length; i++) {
          await expect(pathItems.nth(i)).toContainText(hierarchyPath[i].displayName);
          await expect(pathItems.nth(i)).toContainText(`(${hierarchyPath[i].key})`);
        }
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

      // loginToCms sets up auth cookies on `page`. openContentById then opens a
      // NEW tab (same browser context = same cookies) so the CMS SPA boots fresh
      // with the correct content hash — no race with SPA default-content load.
      await loginToCms(page, config);
      const editTab = await openContentById(page, config, resolved.key);

      const collector = createErrorCollector();
      collector.attach(editTab);

      // Wait for the preview iframe with the CORRECT content key in the new tab.
      const keyDashless = resolved.key.replace(/-/g, '');
      const findFrame = () => editTab.frames().find((f) => f.url().includes(keyDashless));

      let frame = findFrame();
      if (!frame) {
        const deadline = Date.now() + 30_000;
        while (Date.now() < deadline) {
          await editTab.waitForTimeout(500);
          frame = findFrame();
          if (frame) break;
        }
      }

      if (!frame) {
        throw new Error(
          `Preview frame for key ${resolved.key} did not appear within 30s.\nFrames seen: ${editTab.frames().map((f) => f.url()).join(' | ')}`,
        );
      }

      await frame.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

      // Verify no application errors
      const body = frame.locator('body');
      await expect(body).not.toContainText('Application Error');
      await expect(body).not.toContainText('500 Internal Server Error');

      // Wait for the component to fully render.
      const titleCell = frame.locator('tr[data-property="title"] td[data-col="value"]');
      await expect(titleCell).toContainText(def.properties.title as string, { timeout: 20_000 });

      // ─── _metadata.categories — locate value cell precisely ──────────
      const rawValueCell = frame.locator('tr[data-property="_metadata.categories"] td[data-col="value"]');
      await expect(rawValueCell).toBeVisible();

      if (expectedCount > 0) {
        await expect(rawValueCell.getByText('No categories assigned')).toHaveCount(0);
        await expect(rawValueCell.locator('ul > li')).toHaveCount(expectedCount);

        const assignedTerms = def.categories as string[];
        for (const termKey of assignedTerms) {
          await expect(
            rawValueCell.locator('ul > li').filter({ hasText: new RegExp(`^${termKey}$`) }),
            `edit: category list should contain term "${termKey}"`,
          ).toHaveCount(1);
        }
      } else {
        await expect(rawValueCell.getByText('No categories assigned')).toBeVisible();
      }

      // ─── _metadata.resolvedCategories — hierarchical case ────────────
      if ((def.expected as any)?.hasHierarchy) {
        const resolvedValueCell = frame.locator('tr[data-property="_metadata.resolvedCategories"] td[data-col="value"]');
        await expect(resolvedValueCell).toBeVisible();

        const expectedTermKeys = (def.expected as any).resolvedTermKeys as string[];
        const expectedDisplayName = (def.expected as any).resolvedDisplayName as string;
        const hierarchyPath = (def.expected as any).hierarchyPath as Array<{ key: string; displayName: string }>;

        for (const termKey of expectedTermKeys) {
          await expect(
            resolvedValueCell.getByText(`Key: ${termKey}`),
            `edit: resolvedCategories should show Key: ${termKey}`,
          ).toBeVisible();
        }
        await expect(resolvedValueCell.locator('div', { hasText: expectedDisplayName }).first())
          .toBeVisible();

        await expect(resolvedValueCell.getByText(`Path (${hierarchyPath.length})`)).toBeVisible();

        const pathItems = resolvedValueCell.locator('ol ol > li');
        await expect(pathItems).toHaveCount(hierarchyPath.length);
        for (let i = 0; i < hierarchyPath.length; i++) {
          await expect(pathItems.nth(i)).toContainText(hierarchyPath[i].displayName);
          await expect(pathItems.nth(i)).toContainText(`(${hierarchyPath[i].key})`);
        }
      }

      expect(collector.errors, 'No critical errors in edit mode').toHaveLength(0);
      collector.detach(editTab);
      await editTab.close();
    });
  }
});
