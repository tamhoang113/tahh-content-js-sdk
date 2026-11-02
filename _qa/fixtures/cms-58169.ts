import type { StoryFixtureDefinition, FixtureCase } from './types.js';
import { patchContentVersion } from '../helpers/content-api.js';

/**
 * CMS-58169: Preview images and videos reload on every save with appended preview token
 *
 * Uses PageContentRefProperty with imageRef pointing to a real CMS image asset.
 * The component renders <img src={src(content.imageRef)}> — in normal mode the URL
 * should NOT contain preview_token. In preview with forceMediaToken, it should.
 */

const IMAGE_ASSET_KEY = '0ea7cc545c0c48e1ad4c49d13b0eccdf';

const cases = {
  pageWithImage: {
    automationId: 'CMS58169_PageWithImage',
    properties: {},
    expected: {
      hasImageRef: true,
    },
  },
} satisfies Record<string, FixtureCase>;

export const CMS_58169: StoryFixtureDefinition<typeof cases> = {
  ticket: 'CMS-58169',
  slug: 'preview_media_token_retry',
  contentTypeKey: 'PageContentRefProperty',
  baseType: '_page',
  locale: 'en',
  provision: 'create',
  featureContainer: {
    displayName: 'CMS_58169_PreviewMediaTokenRetry',
    contentTypeKey: 'LandingExperience',
    properties: {
      hero: {
        value: {
          properties: {
            heading: { value: 'CMS-58169 Preview Media Token Retry' },
            summary: {
              value:
                'In preview mode, media URLs omit the preview token by default. When an image or video fails to load, the preview component retries it with the token.',
            },
          },
        },
      },
    },
  },
  cases,

  async afterProvision(config, resolved) {
    if (!resolved.pageWithImage.created) return;

    await patchContentVersion(config, resolved.pageWithImage.key, {
      imageRef: {
        value: `cms://content/${IMAGE_ASSET_KEY}`,
      },
    });
  },
};

export { IMAGE_ASSET_KEY };
