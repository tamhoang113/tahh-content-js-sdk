import type { StoryFixtureDefinition, FixtureCase } from './types.js';
import { patchContentVersion } from '../helpers/content-api.js';

/**
 * CMS-49490 — Circular fragment references in GraphQL query generation.
 *
 * Fixture data: an ArticlePage whose BodyContent array contains itself (self-ref)
 * and a MapPage (cross-ref / indirect cycle). The circular reference in the
 * content structure triggers circular fragment spreads in GraphQL if the SDK
 * doesn't guard against it.
 *
 * Provisioned via Integration API (`provision: 'create'`):
 *   1. Create container (BlankExperience) as folder
 *   2. Create MapPage (no references needed)
 *   3. Create ArticlePage (no references yet)
 *   4. `afterProvision`: patch ArticlePage.BodyContent = [self-ref, MapPage ref]
 *
 * Content type source of truth (code-first):
 *   qa-app/src/components/CMS_49490_CircularFragmentFix.tsx
 */

const cases = {
  mapPage: {
    automationId: 'CMS49490_MapPage',
    contentTypeKey: 'CMS49490MapPage',
    properties: {
      Title: "I'm Map Page",
    },
    expected: {
      title: "I'm Map Page",
    },
  },
  articlePage: {
    automationId: 'CMS49490_ArticlePage',
    properties: {
      Title: "I'm ArticlePage",
    },
    expected: {
      title: "I'm ArticlePage",
      bodyContentLength: 2,
      child0Type: 'CMS49490ArticlePage',
      child0Title: "I'm ArticlePage",
      child1Type: 'CMS49490MapPage',
      child1Title: "I'm Map Page",
    },
  },
} satisfies Record<string, FixtureCase>;

export const CMS_49490: StoryFixtureDefinition<typeof cases> = {
  ticket: 'CMS-49490',
  slug: 'CMS_49490_CircularFragmentFix',
  contentTypeKey: 'CMS49490ArticlePage',
  baseType: '_page',
  locale: 'en',
  provision: 'create',
  featureContainer: {
    displayName: 'CMS_49490_CircularAllowedType',
    contentTypeKey: 'LandingExperience',
    properties: {
      hero: {
        value: {
          properties: {
            heading: { value: 'CMS-49490 Circular Fragment Fix' },
            summary: { value: 'Self-referencing content types with array properties should not produce circular fragment spreads in GraphQL query generation.' },
          },
        },
      },
    },
  },
  cases,

  async afterProvision(config, resolved) {
    const articleKey = resolved.articlePage.key;
    const mapKey = resolved.mapPage.key;

    await patchContentVersion(config, articleKey, {
      BodyContent: {
        value: [
          { reference: `cms://content/${articleKey}` },
          { reference: `cms://content/${mapKey}` },
        ],
      },
    });
  },
};

export type CMS49490CaseId = keyof typeof cases;
