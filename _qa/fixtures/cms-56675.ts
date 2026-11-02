import type { StoryFixtureDefinition, FixtureCase } from './types.js';
import { createContent } from '../helpers/content-api.js';
import { findContentPathByDisplayName } from '../helpers/graph-api.js';

/**
 * CMS-56675 — Locale fallback fix for getPath/getItems/getContent.
 *
 * Auto-provisioned via Integration API:
 *   1. Parent page in nl locale with fullString value
 *   2. afterProvision: 4 child pages under the parent, each in a different locale
 *
 * Requires CMS language fallback config: fr → nl, nl-BE → nl
 */

const CHILDREN = [
  { automationId: 'CMS56675_ChildItem_nl', locale: 'nl', fullString: 'Child nl' },
  { automationId: 'CMS56675_ChildItem_fr', locale: 'fr', fullString: 'Child fr' },
  { automationId: 'CMS56675_ChildItem_nl_BE', locale: 'nl-BE', fullString: 'Child nl-BE' },
  { automationId: 'CMS56675_ChildItem_en', locale: 'en', fullString: 'Child en' },
] as const;

const cases = {
  parentPage: {
    automationId: 'CMS56675_LocaleFallback_nl',
    locale: 'nl',
    properties: {
      fullString: 'This is master version in nl language',
    },
    expected: {
      fullString: 'This is master version in nl language',
      children: CHILDREN,
    },
  },
} satisfies Record<string, FixtureCase>;

export const CMS_56675: StoryFixtureDefinition<typeof cases> = {
  ticket: 'CMS-56675',
  slug: 'CMS_56675_LocaleFallback',
  contentTypeKey: 'PageStringProperty',
  baseType: '_page',
  locale: 'nl',
  provision: 'create',
  featureContainer: {
    displayName: 'CMS_56675_LocaleFallbackContainer',
    contentTypeKey: 'LandingExperience',
    properties: {
      hero: {
        value: {
          properties: {
            heading: { value: 'CMS-56675 Locale Fallback Fix' },
            summary: { value: 'getPath/getItems/getContent should respect language fallbacks and accept BCP-47 locales' },
          },
        },
      },
    },
  },
  cases,

  async afterProvision(config, resolved) {
    if (!resolved.parentPage.created) return;

    const parentKey = resolved.parentPage.key.replace(/-/g, '');

    for (const child of CHILDREN) {
      const existing = await findContentPathByDisplayName(config, child.automationId);
      if (existing) continue;

      await createContent(config, {
        contentTypeKey: 'PageStringProperty',
        container: parentKey,
        displayName: child.automationId,
        locale: child.locale,
        properties: { fullString: child.fullString },
        publish: true,
      });
    }
  },
};
