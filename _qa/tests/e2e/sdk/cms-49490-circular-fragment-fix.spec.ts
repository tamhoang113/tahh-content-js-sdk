/**
 * CMS-49490: Circular fragment references — Edit Mode Preview (getPreviewContent)
 *
 * SDK test covers getContentByPath (view mode).
 * This E2E test covers getPreviewContent (edit mode) — a different code path
 * that also generates GraphQL fragments and could regress independently.
 *
 * Verification strategy (precise, no false-pass from parent text):
 *   - Second tr[data-property="BodyContent"] = child ArticlePage's own row
 *     → exists only if self-referencing child rendered its full table structure
 *   - tr[data-property="MainMap"] = only MapPage has this property
 *     → exists only if cross-referencing MapPage child rendered
 *   If circular fragment regresses, children return only __typename → no table
 *   rows → both locators fail.
 *
 * Fixture: CMS49490_ArticalPage
 *   Title = "I'm ArticalPage"
 *   BodyContent[0] = CMS49490ArticlePage (self-ref)
 *   BodyContent[1] = CMS49490MapPage,    Title = "I'm Map Page"
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
  findContentPathByDisplayName,
  waitForPreviewFrame,
} from '../../../helpers/index.js';

const config = loadSiteConfig('qa-app');

const TEST_DISPLAY_NAME = process.env.CMS49490_TEST_DISPLAY_NAME ?? 'CMS49490_ArticalPage';

const EXPECTED = {
  title: process.env.CMS49490_EXPECTED_TITLE ?? "I'm ArticalPage",
  child1Title: process.env.CMS49490_EXPECTED_CHILD1_TITLE ?? "I'm Map Page",
};

test.describe('Edit — CMS-49490 CircularFragmentFix (getPreviewContent)', () => {

  test('preview renders self-ref and cross-ref children with full table structure', async ({ page }) => {
    const lookup = await findContentPathByDisplayName(config, TEST_DISPLAY_NAME);
    expect(
      lookup,
      `No content found with displayName "${TEST_DISPLAY_NAME}" — set CMS49490_TEST_DISPLAY_NAME`,
    ).toBeTruthy();

    await loginToCms(page, config);

    const collector = createErrorCollector();
    const editPage = await openContentById(page, config, lookup!.key);
    collector.attach(editPage);

    const frame = await waitForPreviewFrame(editPage, 30_000);
    await frame.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

    // Wait for parent page to render
    await expect(frame.locator('tr[data-property="Title"]').first()).toBeVisible({ timeout: 15_000 });

    // 1. Self-reference proof: second tr[data-property="BodyContent"] belongs to
    //    child ArticlePage — only exists if child rendered its own full table.
    //    If circular fragment regresses, child has only __typename → no table rows.
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
      'MapPage child (cross-ref) did not render its MainMap row — indirect cycle (ArticlePage↔MapPage) regression in getPreviewContent',
    ).toBeVisible({ timeout: 10_000 });

    // 3. MapPage child's Title must be "I'm Map Page" — scoped: find the Title
    //    cell that is a sibling of MainMap within the same table (MapPage's table)
    const mapPageTable = childMapMainMapRow.locator('xpath=ancestor::table[1]');
    const mapPageTitleCell = mapPageTable.locator('tr[data-property="Title"] td[data-col="value"]');
    await expect(
      mapPageTitleCell,
      `MapPage child Title should be "${EXPECTED.child1Title}"`,
    ).toContainText(EXPECTED.child1Title);

    // 4. No errors
    const fullText = await frame.locator('body').innerText().catch(() => '');
    expect(fullText).not.toContain('Application Error');
    expect(fullText).not.toContain('Cannot spread fragment');

    expect(collector.errors, 'No critical errors in edit mode').toHaveLength(0);
    collector.detach(editPage);
    await editPage.close();
  });
});
