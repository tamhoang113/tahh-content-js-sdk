import type { StoryFixtureDefinition, FixtureCase } from './types.js';
import { createVariationVersion } from '../helpers/content-api.js';

/**
 * CMS-56719 — Variation filter fix for getContentByPath.
 *
 * Single source of truth for the variation test data. Uses
 * PageStringProperty content type (baseType: _page) with CMS variations.
 *
 * Content type source of truth (code-first):
 *   qa-app/src/components/all_properties/PageStringProperty.tsx
 *
 * Auto-provisioned via Integration API:
 *   1. ensureStoryFixtures creates the base page with fullString = "base-value"
 *   2. afterProvision creates 4 variation versions via POST /versions
 *   3. Each variation sets fullString to its logical name
 */

export const VARIATION_DATA = [
  { variation: null,            fullString: 'base-value' },
  { variation: 'v_business',    fullString: 'business' },
  { variation: 'v_investments', fullString: 'investments' },
  { variation: 'v_mortgages',   fullString: 'mortgages' },
  { variation: 'v_personal',    fullString: 'personal' },
] as const;

const cases = {
  variationPage: {
    automationId: 'CMS56719_VariationPage',
    properties: {
      fullString: 'base-value',
    },
    expected: {
      allCount: VARIATION_DATA.length,
      variations: VARIATION_DATA,
      baseFullString: VARIATION_DATA.find(v => v.variation === null)!.fullString,
    },
  },
} satisfies Record<string, FixtureCase>;

export const CMS_56719: StoryFixtureDefinition<typeof cases> = {
  ticket: 'CMS-56719',
  slug: 'CMS_56719_VariationFilter',
  contentTypeKey: 'PageStringProperty',
  baseType: '_page',
  locale: 'en',
  provision: 'create',
  featureContainer: {
    displayName: 'CMS_56719_VariationFilterContainer',
    contentTypeKey: 'LandingExperience',
    properties: {
      hero: {
        value: {
          properties: {
            heading: { value: 'CMS-56719 Variation Filter Fix' },
            summary: { value: 'getContentByPath with variation SOME/ALL should work correctly with includeOriginal' },
          },
        },
      },
    },
  },
  cases,

  async afterProvision(config, resolved) {
    if (!resolved.variationPage.created) return; // page already existed → variations too

    const key = resolved.variationPage.key;
    for (const v of VARIATION_DATA) {
      if (v.variation === null) continue;
      await createVariationVersion(config, key, v.variation, {
        fullString: v.fullString,
      }, {
        publish: true,
        locale: 'en',
        displayName: resolved.variationPage.displayName,
      });
    }
  },
};

export type CMS56719CaseId = keyof typeof cases;
