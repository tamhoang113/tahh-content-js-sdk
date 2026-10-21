import type { StoryFixtureDefinition, FixtureCase } from './types.js';

/**
 * CMS-56719 — Variation filter fix for getContentByPath.
 *
 * Single source of truth for the variation test data. Uses existing
 * AutoStringAllFields content type (baseType: _page) with CMS variations.
 *
 * Content type source of truth (code-first):
 *   samples/nextjs-template/src/qa/Auto_Push_PropertyTypes.tsx
 *
 * MANUAL SETUP (variations cannot be provisioned via Integration API):
 *   1. Create an AutoStringAllFields page under the test container
 *   2. Set displayName to "CMS_56719_VariationFilter"
 *   3. Set fullString to "base-value" in the base version, publish
 *   4. Create 4 CMS variations: v_business, v_investments, v_mortgages, v_personal
 *   5. In each variation, set fullString to the variation's logical name
 *      (e.g. v_business → fullString "business")
 *   6. Publish all variations
 */

const CONTENT_TYPE_KEY = 'AutoStringAllFields';

export const VARIATION_DATA = [
  { variation: null,            fullString: 'base-value' },
  { variation: 'v_business',    fullString: 'business' },
  { variation: 'v_investments', fullString: 'investments' },
  { variation: 'v_mortgages',   fullString: 'mortgages' },
  { variation: 'v_personal',    fullString: 'personal' },
] as const;

const cases = {
  variationPage: {
    automationId: 'CMS_56719_VariationFilter',
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
  contentTypeKey: CONTENT_TYPE_KEY,
  baseType: '_page',
  locale: 'en',
  provision: 'manual',
  cases,
};

export type CMS56719CaseId = keyof typeof cases;
