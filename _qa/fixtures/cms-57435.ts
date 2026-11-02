import type { StoryFixtureDefinition, FixtureCase } from './types.js';
import { patchContentVersion } from '../helpers/content-api.js';

const IMAGE_ASSET_KEY = '0ea7cc545c0c48e1ad4c49d13b0eccdf';

const cases = {
  pageWithImageRef: {
    automationId: 'CMS57435_PageWithImageRef',
    properties: {},
    expected: {
      hasImageItem: true,
      imageItemHasMetadata: true,
    },
  },
} satisfies Record<string, FixtureCase>;

export const CMS_57435: StoryFixtureDefinition<typeof cases> = {
  ticket: 'CMS-57435',
  slug: 'contentref_image_metadata',
  contentTypeKey: 'PageContentRefProperty',
  baseType: '_page',
  locale: 'en',
  provision: 'create',
  featureContainer: {
    displayName: 'CMS_57435_ContentRefImageMetadata',
    contentTypeKey: 'LandingExperience',
    properties: {
      hero: {
        value: {
          properties: {
            heading: { value: 'CMS-57435 ContentRef Image Metadata' },
            summary: {
              value: 'contentReference with allowedTypes _image should return item with _metadata, assetMetadata, imageMetadata in the page response.',
            },
          },
        },
      },
    },
  },
  cases,

  async afterProvision(config, resolved) {
    if (!resolved.pageWithImageRef.created) return;

    await patchContentVersion(config, resolved.pageWithImageRef.key, {
      imageRef: {
        value: `cms://content/${IMAGE_ASSET_KEY}`,
      },
    });
  },
};
