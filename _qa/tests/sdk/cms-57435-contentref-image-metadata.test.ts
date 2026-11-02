import { describe, test, expect, beforeAll } from 'vitest';
import { loadSiteConfig, ensureStoryFixtures, callSdkApi, resolveTestContainer, getContentByDisplayName } from '../../helpers/index.js';
import { CMS_57435 } from '../../fixtures/cms-57435.js';

const config = loadSiteConfig('qa-app');
const container = resolveTestContainer();

let fixtures: Awaited<ReturnType<typeof ensureStoryFixtures<typeof CMS_57435>>>;

describe.skipIf(!container)('CMS-57435: contentReference returns image metadata', () => {
  beforeAll(async () => {
    fixtures = await ensureStoryFixtures(config, CMS_57435, { container });
  });

  test('imageRef.item exists and is ImageMedia type', async () => {
    const result = await callSdkApi(config, 'getContentByPath', { path: fixtures.pageWithImageRef.path });

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);

    const content = result.data[0];
    expect(content.imageRef).toBeDefined();
    expect(content.imageRef.item).toBeDefined();
    expect(content.imageRef.item.__typename).toBe('ImageMedia');
  });

  test('imageRef.item contains _metadata with key', async () => {
    const result = await callSdkApi(config, 'getContentByPath', { path: fixtures.pageWithImageRef.path });
    const item = result.data[0].imageRef.item;

    expect(item._metadata).toBeDefined();
    expect(item._metadata.key).toBeTruthy();
  });

  test('imageRef.item contains assetMetadata', async () => {
    const result = await callSdkApi(config, 'getContentByPath', { path: fixtures.pageWithImageRef.path });
    const item = result.data[0].imageRef.item;

    expect(item).toHaveProperty('assetMetadata');
  });

  test('imageRef.item contains imageMetadata', async () => {
    const result = await callSdkApi(config, 'getContentByPath', { path: fixtures.pageWithImageRef.path });
    const item = result.data[0].imageRef.item;

    expect(item).toHaveProperty('imageMetadata');
  });

  test('simpleRef (allowedTypes: _page) does NOT return item', async () => {
    const result = await callSdkApi(config, 'getContentByPath', { path: fixtures.pageWithImageRef.path });
    const content = result.data[0];

    if (content.simpleRef) {
      expect(content.simpleRef.item).toBeUndefined();
    }
  });

  test('getContent by key returns imageRef with url and item', async () => {
    const result = await callSdkApi(config, 'getContent', { key: fixtures.pageWithImageRef.key });

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data.imageRef).toBeDefined();
    expect(result.data.imageRef.url).toBeDefined();
    expect(result.data.imageRef.item).toBeDefined();
    expect(result.data.imageRef.item.__typename).toBe('ImageMedia');
  });
});
