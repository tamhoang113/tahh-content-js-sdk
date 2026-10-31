/**
 * CMS-49490: Circular fragment references in GraphQL query generation
 *
 * Fixture-driven: test data is provisioned from the single source of truth in
 * `_qa/fixtures/cms-49490.ts` (via .episerverdata package import) instead of
 * being added to the site by hand. Tests resolve each case to a real `key`/`path`
 * at runtime and never hardcode a GUID, URL path, or display name.
 *
 * Bug: Content types with array properties that reference themselves (directly
 *      or indirectly via another type) produced circular fragment spreads that
 *      GraphQL rejected: "Cannot spread fragment MapPage within itself."
 * Fix: PR #496 (ancestors set) -> PR #625 (restore cyclic fragments — Graph
 *      supports them natively via @recursive directive behavior).
 *
 * Prerequisites:
 *   1. Content types pushed:  cd qa-app && opti-cms push
 *   2. CMS_TEST_CONTAINER (or CMS_TEST_CONTAINER_CMS_49490) = parent container GUID
 *   3. Dev server running:    cd qa-app && pnpm dev
 *
 * Run:
 *   pnpm test:sdk -- cms-49490
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentByDisplayName } from '../../helpers/sdk-api.js';
import { ensureStoryFixtures, resolveTestContainer } from '../../helpers/fixtures.js';
import type { ResolvedFixture } from '../../fixtures/types.js';
import { CMS_49490, type CMS49490CaseId } from '../../fixtures/cms-49490.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer(CMS_49490.ticket);

describe.skipIf(!container)('CMS-49490: circular fragment references in self-referencing content types', () => {
  let fixtures: Record<CMS49490CaseId, ResolvedFixture>;
  const EXPECTED = CMS_49490.cases.articlePage.expected!;

  beforeAll(async () => {
    fixtures = await ensureStoryFixtures(config, CMS_49490, {
      container: container!,
    });
  }, 120_000);

  test('ArticlePage Title matches expected value', async () => {
    const { content: page } = await getContentByDisplayName(
      config,
      fixtures.articlePage.displayName,
    );
    const loc = `key="${fixtures.articlePage.key}" path="${fixtures.articlePage.path}"`;

    expect(
      page.Title,
      `ArticlePage.Title wrong — circular fragment regression would lose all properties. ${loc}`,
    ).toBe(EXPECTED.title);
  });

  test('BodyContent has exactly 2 children (self-ref + cross-ref)', async () => {
    const { content: page } = await getContentByDisplayName(
      config,
      fixtures.articlePage.displayName,
    );
    const loc = `key="${fixtures.articlePage.key}" path="${fixtures.articlePage.path}"`;

    expect(
      page.BodyContent,
      `BodyContent is undefined — fragment may not have resolved the array. ${loc}`,
    ).toBeDefined();
    expect(
      page.BodyContent.length,
      `BodyContent should have exactly ${EXPECTED.bodyContentLength} children. ${loc}`,
    ).toBe(EXPECTED.bodyContentLength);
  });

  test('BodyContent[0] is CMS49490ArticlePage (self-reference) with correct Title', async () => {
    const { content: page } = await getContentByDisplayName(
      config,
      fixtures.articlePage.displayName,
    );
    const loc = `key="${fixtures.articlePage.key}" path="${fixtures.articlePage.path}"`;

    const child0 = page.BodyContent[0];
    expect(
      child0.__typename,
      `BodyContent[0].__typename should be "${EXPECTED.child0Type}" (self-reference). ${loc}`,
    ).toBe(EXPECTED.child0Type);
    expect(
      child0.Title,
      `BodyContent[0].Title should be "${EXPECTED.child0Title}" — circular fragment regression returns only __typename without properties. ${loc}`,
    ).toBe(EXPECTED.child0Title);
  });

  test('BodyContent[1] is CMS49490MapPage (cross-reference) with correct Title', async () => {
    const { content: page } = await getContentByDisplayName(
      config,
      fixtures.articlePage.displayName,
    );
    const loc = `key="${fixtures.articlePage.key}" path="${fixtures.articlePage.path}"`;

    const child1 = page.BodyContent[1];
    expect(
      child1.__typename,
      `BodyContent[1].__typename should be "${EXPECTED.child1Type}" (indirect cycle). ${loc}`,
    ).toBe(EXPECTED.child1Type);
    expect(
      child1.Title,
      `BodyContent[1].Title should be "${EXPECTED.child1Title}" — indirect cycle (ArticlePage<->MapPage) regression. ${loc}`,
    ).toBe(EXPECTED.child1Title);
  });

  test('no GraphQL circular reference error in response', async () => {
    const { content: page } = await getContentByDisplayName(
      config,
      fixtures.articlePage.displayName,
    );
    const loc = `key="${fixtures.articlePage.key}" path="${fixtures.articlePage.path}"`;

    const pageStr = JSON.stringify(page);
    expect(
      pageStr,
      `Response contains "Cannot spread fragment" — circular fragment bug is present. ${loc}`,
    ).not.toContain('Cannot spread fragment');
  });
});
