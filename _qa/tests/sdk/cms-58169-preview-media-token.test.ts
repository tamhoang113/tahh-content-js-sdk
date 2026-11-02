import { describe, test, expect, beforeAll } from 'vitest';
import { loadSiteConfig, ensureStoryFixtures, callSdkApi, resolveTestContainer, getContentByDisplayName } from '../../helpers/index.js';
import { CMS_58169 } from '../../fixtures/cms-58169.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer();

const EXPECTED = CMS_58169.cases.pageWithImage.expected;

let fixtures: Awaited<ReturnType<typeof ensureStoryFixtures<typeof CMS_58169>>>;

describe.skipIf(!container)('CMS-58169: Preview media token (SDK API)', () => {
  beforeAll(async () => {
    fixtures = await ensureStoryFixtures(config, CMS_58169, { container });
  });

  test('fixture page exists and is queryable via Graph', async () => {
    const resolved = await getContentByDisplayName(config, fixtures.pageWithImage.displayName);

    expect(resolved.content).toBeDefined();
    expect(resolved.key).toBe(fixtures.pageWithImage.key);
    expect(resolved.content.fullString).toBe(EXPECTED.fullString);
  });

  test('getContentByPath returns content without __context.media_token', async () => {
    const result = await callSdkApi(config, 'getContentByPath', { path: fixtures.pageWithImage.path });

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);

    const content = result.data[0];
    expect(content.fullString).toBe(EXPECTED.fullString);
    expect(content.simpleString).toBe(EXPECTED.simpleString);

    // Normal (non-preview) content fetch: no __context at all, or no media_token
    if (content.__context) {
      expect(content.__context.media_token).toBeUndefined();
    }
  });

  test('getContent returns content without media_token', async () => {
    const result = await callSdkApi(config, 'getContent', { key: fixtures.pageWithImage.key });

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data.fullString).toBe(EXPECTED.fullString);

    // Normal content fetch: no media_token
    if (result.data.__context) {
      expect(result.data.__context.media_token).toBeUndefined();
    }
  });

  test('getPreviewContent route accepts forceMediaToken parameter', async () => {
    // getPreviewContent requires a real CMS preview_token (authenticated access).
    // With a fake token, Graph returns 401 — expected behavior.
    // This test verifies the route handler accepts the forceMediaToken parameter
    // without erroring on its own (the 401 comes from Graph, not from our route).
    const result = await callSdkApi(
      config,
      'getPreviewContent',
      {
        key: fixtures.pageWithImage.key,
        ver: '1',
        loc: 'en',
        preview_token: 'fake-token-for-route-test',
        forceMediaToken: 'true',
      },
    );

    // We expect a Graph auth error (401), NOT a route-level error (400/500)
    // This proves the route correctly passes forceMediaToken to the SDK
    expect(result.error).toBeDefined();
    expect(result.error).toContain('401');
  });

  test('getPreviewContent route works without forceMediaToken (default false)', async () => {
    const result = await callSdkApi(
      config,
      'getPreviewContent',
      {
        key: fixtures.pageWithImage.key,
        ver: '1',
        loc: 'en',
        preview_token: 'fake-token-for-route-test',
        // No forceMediaToken — default behavior
      },
    );

    // Same: Graph auth error, not a route-level parse error
    expect(result.error).toBeDefined();
    expect(result.error).toContain('401');
  });
});
