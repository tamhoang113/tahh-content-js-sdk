/**
 * CMS-54844: Section properties exposed flat on content — SDK API verification
 *
 * Bug: custom properties of a `_section` content type were only reachable at
 *      content.component.<prop> when the section rendered inside a composition.
 * Fix: OptimizelyComposition now spreads the section's own component into
 *      content, so content.heading / content.subtitle work directly.
 *
 * This test resolves the test page's *current* path dynamically by its display
 * name (via Graph), then walks the composition tree returned by
 * getContentByPath to find the CMS54844HeroSection node and asserts its
 * properties are flat on `content` (not nested under `content.component`).
 *
 * Why resolve by display name instead of hardcoding a path:
 *   Display names follow the QA fixture convention (CMS{id}_{ShortDesc}) and are
 *   set once, whereas URL paths are recomputed from the content tree when a page
 *   is moved (hierarchical URLs depend on ancestors). Resolving by display name
 *   keeps the test working across content reorgs without code changes.
 *
 * Prerequisites:
 *   1. Content types pushed:  cd samples/nextjs-template && opti-cms push
 *   2. Test page created + published in CMS containing a CMS54844HeroSection
 *      with heading/subtitle filled in
 *   3. Content indexed to Graph
 *   4. Dev server running:    cd samples/nextjs-template && pnpm dev
 *
 * Run:
 *   pnpm test:sdk
 *
 * Configure the fixture's display name via env var if it differs:
 *   CMS54844_TEST_DISPLAY_NAME="My Test Page" pnpm test:sdk
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentByDisplayName } from '../../helpers/sdk-api.js';

const config = loadSiteConfig('nextjs-template');

const TEST_DISPLAY_NAME = process.env.CMS54844_TEST_DISPLAY_NAME ?? 'CMS54844_SectionPropertiesFlat';

// Exact expected text is optional — set via env vars if your test content uses fixed values.
// When not set, the test only verifies properties are flat & non-empty (the actual bug contract).
const EXPECTED = {
  heading: process.env.CMS54844_TEST_HEADING ?? "heading",
  subtitle: process.env.CMS54844_TEST_SUBTITLE ?? "subtitle",
};

/**
 * Recursively search a content object graph (page → composition.nodes → ...)
 * for the first node whose metadata types include the given content type key.
 */
function findNodeByType(node: any, typeKey: string, seen = new Set<any>()): any {
  if (!node || typeof node !== 'object' || seen.has(node)) return undefined;
  seen.add(node);

  const types: string[] | undefined = node._metadata?.types ?? node.content?._metadata?.types;
  const candidate = node.content ?? node;
  if (types?.includes(typeKey)) {
    return candidate;
  }

  const children: any[] = node.composition?.nodes ?? node.nodes ?? [];
  for (const child of children) {
    const found = findNodeByType(child, typeKey, seen);
    if (found) return found;
  }

  // Fall back to scanning all object/array properties (covers content areas, arrays, etc.)
  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') {
      const found = findNodeByType(value, typeKey, seen);
      if (found) return found;
    }
  }

  return undefined;
}

describe('CMS-54844: section properties flat on content', () => {
  test('section heading/subtitle are flat on content, not under content.component', async () => {
    const { content: page, key, path } = await getContentByDisplayName(
      config,
      TEST_DISPLAY_NAME,
      'CMS54844_TEST_DISPLAY_NAME',
    );

    const section = findNodeByType(page, 'CMS54844HeroSection');
    expect(section, 'CMS54844HeroSection node not found in page composition').toBeTruthy();

    // Bug regression guard: properties must NOT be nested under `.component`
    expect(section.component?.heading, 'heading leaked into content.component — bug regressed').toBeUndefined();
    expect(section.component?.subtitle, 'subtitle leaked into content.component — bug regressed').toBeUndefined();

    // Fixed behavior: properties are flat on content and populated (not undefined/blank)
    expect(section.heading, 'content.heading missing — should be flat on content').toBeTruthy();
    expect(section.subtitle, 'content.subtitle missing — should be flat on content').toBeTruthy();

    // Optional strict check when exact fixture text is provided via env vars.
    // A mismatch here means the CMS fixture data itself is wrong (e.g. typo when
    // creating the test content) — NOT a bug regression, since the two checks
    // above already proved the property is flat, non-empty, and not leaking
    // under `.component`. Fix by correcting the value in CMS, or update the
    // CMS54844_EXPECTED_* env var to match the real fixture text.
    const fixtureLocation = `displayName="${TEST_DISPLAY_NAME}" key="${key}" path="${path}"`;
    if (EXPECTED.heading) {
      expect(
        section.heading,
        `content.heading value mismatch — CMS fixture data issue (not a bug regression). ${fixtureLocation}. Expected "${EXPECTED.heading}", got "${section.heading}". Fix the "heading" property on this page in CMS, or update CMS54844_EXPECTED_HEADING.`,
      ).toBe(EXPECTED.heading);
    }
    if (EXPECTED.subtitle) {
      expect(
        section.subtitle,
        `content.subtitle value mismatch — CMS fixture data issue (not a bug regression). ${fixtureLocation}. Expected "${EXPECTED.subtitle}", got "${section.subtitle}". Fix the "subtitle" property on this page in CMS, or update CMS54844_EXPECTED_SUBTITLE.`,
      ).toBe(EXPECTED.subtitle);
    }
  });
});
