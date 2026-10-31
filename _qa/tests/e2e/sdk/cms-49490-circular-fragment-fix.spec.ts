/**
 * CMS-49490: Circular fragment references — Edit Mode Preview (getPreviewContent)
 *
 * Fixture-driven: test data is provisioned from the single source of truth in
 * `_qa/fixtures/cms-49490.ts` instead of being added to the site by hand.
 *
 * SDK test covers getContentByPath (view mode).
 * This E2E test covers getPreviewContent (edit mode) — a different code path
 * that also generates GraphQL fragments and could regress independently.
 *
 * Verification strategy (precise, no false-pass from parent text):
 *   - Second tr[data-property="BodyContent"] = child ArticlePage's own row
 *     -> exists only if self-referencing child rendered its full table structure
 *   - tr[data-property="MainMap"] = only MapPage has this property
 *     -> exists only if cross-referencing MapPage child rendered
 *   If circular fragment regresses, children return only __typename -> no table
 *   rows -> both locators fail.
 *
 * Prerequisites:
 *   1. Content types pushed:  cd qa-app && opti-cms push
 *   2. CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_49490) = parent container GUID
 *   3. Dev server running:    cd qa-app && pnpm dev
 *
 * Run:
 *   pnpm test:e2e -- --grep "CMS-49490"
 */

import { test, expect } from '@playwright/test';
import {
  loadSiteConfig,
  loginToCms,
  openContentById,
  createErrorCollector,
  waitForPreviewFrame,
} from '../../../helpers/index.js';
import { ensureStoryFixtures, resolveTestContainer } from '../../../helpers/fixtures.js';
import { CMS_49490 } from '../../../fixtures/cms-49490.js';
import type { ResolvedFixture } from '../../../fixtures/types.js';
import type { CMS49490CaseId } from '../../../fixtures/cms-49490.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer(CMS_49490.ticket);
const EXPECTED = CMS_49490.cases.articlePage.expected!;

test.describe('Edit — CMS-49490 CircularFragmentFix (getPreviewContent)', () => {
  let fixtures: Record<CMS49490CaseId, ResolvedFixture>;

  test.beforeAll(async () => {
    test.skip(!container, 'CMS_TEST_CONTAINER not set — skipping fixture-driven E2E');
    fixtures = await ensureStoryFixtures(config, CMS_49490, {
      container: container!,
    });
  });

  test('preview renders self-ref and cross-ref children with full table structure', async ({ page }) => {
    test.skip(!container, 'CMS_TEST_CONTAINER not set');

    await loginToCms(page, config);

    const collector = createErrorCollector();
    const editPage = await openContentById(page, config, fixtures.articlePage.key);
    collector.attach(editPage);

    const frame = await waitForPreviewFrame(editPage, 30_000);
    await frame.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

    // Wait for parent page to render
    await expect(frame.locator('tr[data-property="Title"]').first()).toBeVisible({ timeout: 15_000 });

    // 1. Self-reference proof: second tr[data-property="BodyContent"] belongs to
    //    child ArticlePage — only exists if child rendered its own full table.
    const childArticleBodyRow = frame.locator('tr[data-property="BodyContent"]').nth(1);
    await expect(
      childArticleBodyRow,
      'Child ArticlePage (self-ref) did not render its own BodyContent row — circular fragment regression in getPreviewContent',
    ).toBeVisible({ timeout: 10_000 });

    // 2. Cross-reference proof: tr[data-property="MainMap"] can ONLY come from
    //    MapPage child (ArticlePage has no MainMap property).
    const childMapMainMapRow = frame.locator('tr[data-property="MainMap"]');
    await expect(
      childMapMainMapRow,
      'MapPage child (cross-ref) did not render its MainMap row — indirect cycle (ArticlePage<->MapPage) regression in getPreviewContent',
    ).toBeVisible({ timeout: 10_000 });

    // 3. MapPage child's Title must match expected — scoped: find the Title
    //    cell that is a sibling of MainMap within the same table (MapPage's table)
    const mapPageTable = childMapMainMapRow.locator('xpath=ancestor::table[1]');
    const mapPageTitleCell = mapPageTable.locator('tr[data-property="Title"] td[data-col="value"]');
    await expect(
      mapPageTitleCell,
      `MapPage child Title should be "${EXPECTED.child1Title}"`,
    ).toContainText(EXPECTED.child1Title as string);

    // 4. No errors
    const fullText = await frame.locator('body').innerText().catch(() => '');
    expect(fullText).not.toContain('Application Error');
    expect(fullText).not.toContain('Cannot spread fragment');

    expect(collector.errors, 'No critical errors in edit mode').toHaveLength(0);
    collector.detach(editPage);
    await editPage.close();
  });
});
