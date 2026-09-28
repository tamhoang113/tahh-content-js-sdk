/**
 * CMS-54844: Section properties exposed flat on content — View + Edit Mode (Playwright)
 *
 * Bug: custom properties of a `_section` content type were only reachable at
 *      content.component.<prop>, so the rendered page showed "(undefined)".
 * Fix: OptimizelyComposition now spreads the section's own component into
 *      content, so content.heading / content.subtitle render correctly.
 *
 * SDK API test is in tests/sdk/cms-54844-section-properties-flat.test.ts (vitest).
 *
 * Prerequisites:
 *   1. Content types pushed:  cd samples/nextjs-template && opti-cms push
 *   2. Test page created + published in CMS containing a CMS54844HeroSection
 *      with heading + subtitle filled in (actual fixture values are configured
 *      via env vars below; whatever's set in CMS must match those)
 *   3. Dev server running:    cd samples/nextjs-template && pnpm dev
 *
 * Run:
 *   pnpm test:e2e -- --grep "CMS-54844"
 *   pnpm test:e2e -- --grep "CMS-54844" --headed
 *
 * Configure display name + expected fixture values via env vars if they differ:
 *   CMS54844_TEST_DISPLAY_NAME="My Test Page" \
 *   CMS54844_EXPECTED_HEADING="Custom heading" \
 *   CMS54844_EXPECTED_SUBTITLE="Custom subtitle" \
 *   pnpm test:e2e -- --grep "CMS-54844"
 *
 * ⚠️ PASS-GIẢ WARNING (QA_CONTEXT.md §6.3):
 *   The sample component renders each field as:
 *     "HeroSection Content.heading: {value}"
 *   The LABEL text "heading" therefore appears on the page regardless of what
 *   `content.heading` evaluates to (empty, undefined, wrong value). A naive
 *   `page.getByText(EXPECTED.heading)` would match the label and silently
 *   pass. To avoid this, every assertion below matches the FULL "label: value"
 *   pair — so a wrong or missing value is provably detected. If you're
 *   updating fixture defaults, keep them distinctive enough that they can't
 *   collide with label text.
 */

import { test, expect } from '@playwright/test';
import {
  loadSiteConfig,
  loginToCms,
  openContentById,
  createErrorCollector,
  findContentPathByDisplayName,
  getPreviewFrameText,
} from '../../../helpers/index.js';

const config = loadSiteConfig('nextjs-template');

const TEST_DISPLAY_NAME = process.env.CMS54844_TEST_DISPLAY_NAME ?? 'CMS54844_SectionPropertiesFlat';

// Actual field VALUES on the CMS54844HeroSection fixture — env-overridable to
// match whatever's set in CMS. Naming aligns with the CMS-54651 pattern
// (CMS{ID}_EXPECTED_{FIELD}) so future refactors can grep uniformly.
const EXPECTED_VALUES = {
  heading: process.env.CMS54844_EXPECTED_HEADING ?? 'heading',
  subtitle: process.env.CMS54844_EXPECTED_SUBTITLE ?? 'subtitle',
};

// Pairs the LABEL text hard-coded by the sample component with the EXPECTED
// value. Matching this joined pair (instead of the value alone) is what
// stops a false pass when the label appears but the value is missing/wrong.
const EXPECTED_PAIRS = {
  heading: `HeroSection Content.heading: ${EXPECTED_VALUES.heading}`,
  subtitle: `HeroSection Content.subtitle: ${EXPECTED_VALUES.subtitle}`,
};

// ─── View mode (public rendered page) ────────────────────────────────────────

test.describe('View — CMS-54844 section properties flat', () => {
  test('section renders flat heading/subtitle without undefined', async ({ page }) => {
    const lookup = await findContentPathByDisplayName(config, TEST_DISPLAY_NAME);
    expect(
      lookup,
      `No content found with displayName "${TEST_DISPLAY_NAME}" — create the test page or set CMS54844_TEST_DISPLAY_NAME`,
    ).toBeTruthy();

    const fixtureLocation = `displayName="${TEST_DISPLAY_NAME}" key="${lookup!.key}" path="${lookup!.path}"`;

    await page.goto(`${config.baseUrl}${lookup!.path}`, {
      waitUntil: 'networkidle',
    });

    const body = await page.locator('body').innerText();
    expect(body.length, `Page body is blank. ${fixtureLocation}`).toBeGreaterThan(50);
    expect(body).not.toContain('Application Error');
    expect(body).not.toContain('500 Internal Server Error');
    // Bug regression guard: section properties reachable only via
    // content.component.<prop> would render "(undefined)" here.
    expect(body, `Found "(undefined)" — section properties not flattened onto content. ${fixtureLocation}`)
      .not.toContain('(undefined)');

    // Value verification: assert the FULL "label: value" pair, not just the
    // value — otherwise the label alone would match and hide a wrong value.
    expect(body, `Heading label+value pair missing/mismatched. Expected: "${EXPECTED_PAIRS.heading}". ${fixtureLocation}`)
      .toContain(EXPECTED_PAIRS.heading);
    expect(body, `Subtitle label+value pair missing/mismatched. Expected: "${EXPECTED_PAIRS.subtitle}". ${fixtureLocation}`)
      .toContain(EXPECTED_PAIRS.subtitle);
  });
});

// ─── Edit mode / Preview (CMS UI → getPreviewContent) ────────────────────────

test.describe('Edit — CMS-54844 section properties flat', () => {
  test('section preview renders flat heading/subtitle in edit mode', async ({ page }) => {
    const lookup = await findContentPathByDisplayName(config, TEST_DISPLAY_NAME);
    expect(
      lookup,
      `No content found with displayName "${TEST_DISPLAY_NAME}" — create the test page or set CMS54844_TEST_DISPLAY_NAME`,
    ).toBeTruthy();

    await loginToCms(page, config);

    const collector = createErrorCollector();
    collector.attach(page);

    await openContentById(page, config, lookup!.key);

    // Preview content verification is a HARD requirement — do NOT wrap in
    // try/catch (see QA_CONTEXT.md §6.3). An earlier version bundled the
    // frame wait AND assertions inside one try/catch as "best-effort", which
    // silently swallowed content-mismatch failures whenever the preview was
    // merely slow, and defeated the whole purpose of asserting values.
    const { text: previewText, frameUrl } = await getPreviewFrameText(page, lookup!.key, 30_000);

    expect(previewText, `Heading label+value pair missing/mismatched in preview. Expected: "${EXPECTED_PAIRS.heading}". frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_PAIRS.heading);
    expect(previewText, `Subtitle label+value pair missing/mismatched in preview. Expected: "${EXPECTED_PAIRS.subtitle}". frameUrl="${frameUrl}"`)
      .toContain(EXPECTED_PAIRS.subtitle);
    expect(previewText).not.toContain('Application Error');
    expect(previewText).not.toContain('500 Internal Server Error');
    expect(previewText, `Found "(undefined)" in edit mode preview. frameUrl="${frameUrl}"`)
      .not.toContain('(undefined)');

    expect(collector.errors, 'No critical errors in edit mode').toHaveLength(0);
    collector.detach(page);
  });
});
