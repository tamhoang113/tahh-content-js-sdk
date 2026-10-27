/**
 * CMS-57435: contentReference should return image metadata with the page request
 *
 * Previously, a contentReference to an image returned only `key` and `url`.
 * After this fix, when allowedTypes includes media types (_image, _video, _media),
 * the reference resolves `item` with _metadata, assetMetadata, and imageMetadata.
 *
 * Prerequisites:
 *   1. Content types pushed: cd samples/nextjs-template && opti-cms push
 *   2. Test content created on CMS:
 *      - Upload any image (uses existing ImageMedia type)
 *      - Create a CMS57435ArticlePage with:
 *        - heroImage: reference to the uploaded image
 *        - gallery: array with at least one image reference
 *   3. Content indexed to Graph
 *   4. Dev server running: cd samples/nextjs-template && pnpm dev
 *
 * Run:
 *   pnpm test:sdk -- cms-57435
 */

import { describe, test, expect } from 'vitest';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentByDisplayName } from '../../helpers/sdk-api.js';

const config = loadSiteConfig('nextjs-template');

const PAGE_DISPLAY_NAME =
  process.env.CMS57435_PAGE_DISPLAY_NAME ?? 'CMS57435_ContentReferenceItem';

const EXPECTED_VALUES = {
  title:
    process.env.CMS57435_EXPECTED_TITLE ??
    'CMS57435_ContentReferenceItem',
  imageMimeType:
    process.env.CMS57435_EXPECTED_MIMETYPE ?? 'image/jpeg',
};

describe('CMS-57435 — contentReference returns image metadata', () => {
  test('heroImage contentReference returns item with _metadata, assetMetadata, imageMetadata', async () => {
    const { content, key, path } = await getContentByDisplayName(
      config,
      PAGE_DISPLAY_NAME,
      'CMS57435_PAGE_DISPLAY_NAME',
    );
    const fixtureLocation = `displayName="${PAGE_DISPLAY_NAME}" key="${key}" path="${path}"`;

    expect(content.title, `title missing. ${fixtureLocation}`).toBe(EXPECTED_VALUES.title);

    // heroImage must have key + url (baseline — always worked)
    const heroImage = content.heroImage;
    expect(heroImage, `heroImage should be present. ${fixtureLocation}`).toBeTruthy();
    expect(heroImage?.key, `heroImage.key. ${fixtureLocation}`).toBeTruthy();
    expect(
      heroImage?.url?.default || heroImage?.url?.hierarchical,
      `heroImage.url. ${fixtureLocation}`,
    ).toBeTruthy();

    // Core of CMS-57435: item is now populated for media references
    const item = heroImage?.item as any;
    expect(item, `heroImage.item should be populated (not just key/url). ${fixtureLocation}`).toBeTruthy();
    expect(item?.__typename, `item.__typename. ${fixtureLocation}`).toBeTruthy();

    // _metadata
    expect(item?._metadata, `item._metadata. ${fixtureLocation}`).toBeTruthy();
    expect(item?._metadata?.displayName, `item._metadata.displayName. ${fixtureLocation}`).toBeTruthy();
    expect(item?._metadata?.key, `item._metadata.key. ${fixtureLocation}`).toBeTruthy();

    // assetMetadata
    expect(item?.assetMetadata, `assetMetadata. ${fixtureLocation}`).toBeTruthy();
    expect(item?.assetMetadata?.fileSize, `fileSize > 0. ${fixtureLocation}`).toBeGreaterThan(0);
    expect(item?.assetMetadata?.mimeType, `mimeType. ${fixtureLocation}`).toBe(EXPECTED_VALUES.imageMimeType);
    expect(item?.assetMetadata?.url, `asset URL. ${fixtureLocation}`).toBeTruthy();

    // imageMetadata
    expect(item?.imageMetadata, `imageMetadata. ${fixtureLocation}`).toBeTruthy();
    expect(item?.imageMetadata?.width, `width > 0. ${fixtureLocation}`).toBeGreaterThan(0);
    expect(item?.imageMetadata?.height, `height > 0. ${fixtureLocation}`).toBeGreaterThan(0);
  });

  test('gallery (array of image references) returns item metadata per entry', async () => {
    const { content, key, path } = await getContentByDisplayName(
      config,
      PAGE_DISPLAY_NAME,
      'CMS57435_PAGE_DISPLAY_NAME',
    );
    const fixtureLocation = `displayName="${PAGE_DISPLAY_NAME}" key="${key}" path="${path}"`;

    const gallery = content.gallery;
    expect(gallery, `gallery should be an array. ${fixtureLocation}`).toBeInstanceOf(Array);
    expect(gallery?.length, `gallery should have at least one image. ${fixtureLocation}`).toBeGreaterThanOrEqual(1);

    const firstRef = gallery?.[0] as any;
    expect(firstRef?.key, `gallery[0].key. ${fixtureLocation}`).toBeTruthy();

    const firstItem = firstRef?.item;
    expect(firstItem, `gallery[0].item should be populated. ${fixtureLocation}`).toBeTruthy();
    expect(firstItem?.__typename, `gallery item __typename. ${fixtureLocation}`).toBeTruthy();
    expect(firstItem?.assetMetadata, `gallery item assetMetadata. ${fixtureLocation}`).toBeTruthy();
    expect(firstItem?.imageMetadata, `gallery item imageMetadata. ${fixtureLocation}`).toBeTruthy();
    expect(firstItem?.imageMetadata?.width, `gallery item width > 0. ${fixtureLocation}`).toBeGreaterThan(0);
    expect(firstItem?.imageMetadata?.height, `gallery item height > 0. ${fixtureLocation}`).toBeGreaterThan(0);
  });

  test('differential: image ref has item AND key/url (not replaced)', async () => {
    const { content, key, path } = await getContentByDisplayName(
      config,
      PAGE_DISPLAY_NAME,
      'CMS57435_PAGE_DISPLAY_NAME',
    );
    const fixtureLocation = `displayName="${PAGE_DISPLAY_NAME}" key="${key}" path="${path}"`;

    const heroImage = content.heroImage;

    // key and url still present (not broken by adding item)
    expect(heroImage?.key, `key still present. ${fixtureLocation}`).toBeTruthy();
    expect(heroImage?.url, `url still present. ${fixtureLocation}`).toBeTruthy();

    // item is the new addition
    const item = heroImage?.item as any;
    expect(item, `item should exist. ${fixtureLocation}`).toBeTruthy();

    // item has real content, not an empty shell
    expect(Object.keys(item).length, `item should have multiple fields. ${fixtureLocation}`).toBeGreaterThan(1);
    expect(item?._metadata?.key, `item._metadata.key. ${fixtureLocation}`).toBeTruthy();
    expect(item?.assetMetadata?.fileSize, `item.assetMetadata.fileSize > 0. ${fixtureLocation}`).toBeGreaterThan(0);
  });
});
