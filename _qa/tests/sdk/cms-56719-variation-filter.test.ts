/**
 * CMS-56719: getContentByPath with variation: { include: 'SOME' } returns HTTP 500,
 * and includeOriginal is silently ignored
 *
 * Regression test for two defects fixed in PR #582:
 * 1. Metadata query declared $v1..$vN variables but never sent their values → HTTP 500
 * 2. includeOriginal was typed but never read → no base version when variation didn't match
 *
 * Uses PageStringProperty content type (baseType: _page) with auto-provisioned variations.
 * Data definition: _qa/fixtures/cms-56719.ts (single source of truth).
 *
 * Run:
 *   pnpm test:sdk -- cms-56719
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { callSdkApi } from '../../helpers/sdk-api.js';
import { ensureStoryFixtures, resolveTestContainer } from '../../helpers/fixtures.js';
import { CMS_56719, VARIATION_DATA } from '../../fixtures/cms-56719.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer();

const VARIATIONS = VARIATION_DATA;
const BASE = VARIATIONS.find(v => v.variation === null)!;
const ALL_COUNT = VARIATIONS.length;

let fixtures: Awaited<ReturnType<typeof ensureStoryFixtures<typeof CMS_56719>>>;

describe.skipIf(!container)('CMS-56719 — Variation Filter Fix', () => {
  let testContentPath: string;

  beforeAll(async () => {
    fixtures = await ensureStoryFixtures(config, CMS_56719, { container });
    testContentPath = fixtures.variationPage.path;
  }, 180_000);

  test('SOME with single value returns that variation (not HTTP 500)', async () => {
    const target = VARIATIONS.find(v => v.variation === 'v_mortgages')!;
    const result = await callSdkApi(config, 'getContentByPath', {
      path: testContentPath,
      variation: JSON.stringify({ include: 'SOME', value: [target.variation] }),
    });

    expect(result.error, `SDK call failed: ${result.error}`).toBeUndefined();
    expect(result.data).toBeTruthy();

    const items = Array.isArray(result.data) ? result.data : [result.data];
    expect(items.length).toBe(1);
    expect(items[0].fullString).toBe(target.fullString);
  });

  test('SOME with non-matching value + includeOriginal returns base version', async () => {
    const result = await callSdkApi(config, 'getContentByPath', {
      path: testContentPath,
      variation: JSON.stringify({ include: 'SOME', value: ['no-such-variation'], includeOriginal: true }),
    });

    expect(result.error, `SDK call failed: ${result.error}`).toBeUndefined();
    expect(result.data).toBeTruthy();

    const items = Array.isArray(result.data) ? result.data : [result.data];
    expect(items.length).toEqual(1);
    expect(items[0].fullString).toBe(BASE.fullString);
  });

  // KNOWN FAIL: SDK/Graph returns a random variation instead of empty when value doesn't match.
  // Keeping assertion at 0 to document correct expected behavior per CMS-56719 ticket.
  test('SOME with non-matching value without includeOriginal returns empty', async () => {
    const result = await callSdkApi(config, 'getContentByPath', {
      path: testContentPath,
      variation: JSON.stringify({ include: 'SOME', value: ['no-such-variation'] }),
    }, { stored: true });

    expect(result.error, `SDK call failed: ${result.error}`).toBeUndefined();

    const items = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
    expect(items.length).toBe(0);
  });

  test('ALL returns all variations including base', async () => {
    const result = await callSdkApi(config, 'getContentByPath', {
      path: testContentPath,
      variation: JSON.stringify({ include: 'ALL' }),
    });

    expect(result.error, `SDK call failed: ${result.error}`).toBeUndefined();
    expect(result.data).toBeTruthy();

    const items = Array.isArray(result.data) ? result.data : [result.data];
    expect(items.length).toBe(ALL_COUNT);

    const values = items.map((item: any) => item.fullString).sort();
    const expectedValues = VARIATIONS.map(v => v.fullString).sort();
    expect(values).toEqual(expectedValues);
  });

  test('no variation option returns base only', async () => {
    const result = await callSdkApi(config, 'getContentByPath', {
      path: testContentPath,
    });

    expect(result.error, `SDK call failed: ${result.error}`).toBeUndefined();
    expect(result.data).toBeTruthy();

    const items = Array.isArray(result.data) ? result.data : [result.data];
    expect(items.length).toBe(1);
    expect(items[0].fullString).toBe(BASE.fullString);
  });

  test('SOME with multiple values returns all requested variations', async () => {
    const picked = VARIATIONS.filter(v => v.variation === 'v_mortgages' || v.variation === 'v_investments');
    const result = await callSdkApi(config, 'getContentByPath', {
      path: testContentPath,
      variation: JSON.stringify({ include: 'SOME', value: picked.map(p => p.variation) }),
    });

    expect(result.error, `SDK call failed: ${result.error}`).toBeUndefined();
    expect(result.data).toBeTruthy();

    const items = Array.isArray(result.data) ? result.data : [result.data];
    expect(items.length).toBe(picked.length);

    const values = items.map((item: any) => item.fullString).sort();
    expect(values).toEqual(picked.map(p => p.fullString).sort());
  });

  test('SOME with includeOriginal includes base in result', async () => {
    const target = VARIATIONS.find(v => v.variation === 'v_mortgages')!;
    const result = await callSdkApi(config, 'getContentByPath', {
      path: testContentPath,
      variation: JSON.stringify({ include: 'SOME', value: [target.variation], includeOriginal: true }),
    });

    expect(result.error, `SDK call failed: ${result.error}`).toBeUndefined();
    expect(result.data).toBeTruthy();

    const items = Array.isArray(result.data) ? result.data : [result.data];
    const values = items.map((item: any) => item.fullString);
    expect(values).toContain(BASE.fullString);
  });
});
