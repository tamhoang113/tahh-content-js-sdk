/**
 * CMS-49490: Circular fragment references in GraphQL query generation
 *
 * Bug: Content types with array properties that reference themselves (directly
 *      or indirectly via another type) produced circular fragment spreads that
 *      GraphQL rejected: "Cannot spread fragment MapPage within itself."
 * Fix: PR #496 (ancestors set) → PR #625 (restore cyclic fragments — Graph
 *      supports them natively via @recursive directive behavior).
 *
 * Fixture: CMS49490_ArticalPage (CMS49490ArticlePage)
 *   BodyContent[0] = CMS49490ArticlePage (self-reference), Title = "I'm ArticalPage"
 *   BodyContent[1] = CMS49490MapPage (cross-reference),    Title = "I'm Map Page"
 *
 * Prerequisites:
 *   1. Content types pushed:  cd qa-app && opti-cms push
 *   2. Test page created + published with the fixture data above
 *   3. Content indexed to Graph
 *   4. Dev server running:    cd qa-app && pnpm dev
 *
 * Run:
 *   pnpm test:sdk -- cms-49490
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentByDisplayName } from '../../helpers/sdk-api.js';

const config = loadSiteConfig('qa-app');

const TEST_DISPLAY_NAME = process.env.CMS49490_TEST_DISPLAY_NAME ?? 'CMS49490_ArticalPage';

const EXPECTED = {
  title: process.env.CMS49490_EXPECTED_TITLE ?? "I'm ArticalPage",
  bodyContentLength: 2,
  child0Type: process.env.CMS49490_EXPECTED_CHILD0_TYPE ?? 'CMS49490ArticlePage',
  child0Title: process.env.CMS49490_EXPECTED_CHILD0_TITLE ?? "I'm ArticalPage",
  child1Type: process.env.CMS49490_EXPECTED_CHILD1_TYPE ?? 'CMS49490MapPage',
  child1Title: process.env.CMS49490_EXPECTED_CHILD1_TITLE ?? "I'm Map Page",
};

describe('CMS-49490: circular fragment references in self-referencing content types', () => {

  test('ArticlePage Title matches expected value', async () => {
    const { content: page, key, path } = await getContentByDisplayName(
      config,
      TEST_DISPLAY_NAME,
      'CMS49490_TEST_DISPLAY_NAME',
    );
    const loc = `displayName="${TEST_DISPLAY_NAME}" key="${key}" path="${path}"`;

    expect(
      page.Title,
      `ArticlePage.Title wrong — circular fragment regression would lose all properties. ${loc}`,
    ).toBe(EXPECTED.title);
  });

  test('BodyContent has exactly 2 children (self-ref + cross-ref)', async () => {
    const { content: page, key, path } = await getContentByDisplayName(
      config,
      TEST_DISPLAY_NAME,
      'CMS49490_TEST_DISPLAY_NAME',
    );
    const loc = `displayName="${TEST_DISPLAY_NAME}" key="${key}" path="${path}"`;

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
    const { content: page, key, path } = await getContentByDisplayName(
      config,
      TEST_DISPLAY_NAME,
      'CMS49490_TEST_DISPLAY_NAME',
    );
    const loc = `displayName="${TEST_DISPLAY_NAME}" key="${key}" path="${path}"`;

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
    const { content: page, key, path } = await getContentByDisplayName(
      config,
      TEST_DISPLAY_NAME,
      'CMS49490_TEST_DISPLAY_NAME',
    );
    const loc = `displayName="${TEST_DISPLAY_NAME}" key="${key}" path="${path}"`;

    const child1 = page.BodyContent[1];
    expect(
      child1.__typename,
      `BodyContent[1].__typename should be "${EXPECTED.child1Type}" (indirect cycle). ${loc}`,
    ).toBe(EXPECTED.child1Type);
    expect(
      child1.Title,
      `BodyContent[1].Title should be "${EXPECTED.child1Title}" — indirect cycle (ArticlePage↔MapPage) regression. ${loc}`,
    ).toBe(EXPECTED.child1Title);
  });

  test('no GraphQL circular reference error in response', async () => {
    const { content: page, key, path } = await getContentByDisplayName(
      config,
      TEST_DISPLAY_NAME,
      'CMS49490_TEST_DISPLAY_NAME',
    );
    const loc = `displayName="${TEST_DISPLAY_NAME}" key="${key}" path="${path}"`;

    const pageStr = JSON.stringify(page);
    expect(
      pageStr,
      `Response contains "Cannot spread fragment" — circular fragment bug is present. ${loc}`,
    ).not.toContain('Cannot spread fragment');
  });
});
