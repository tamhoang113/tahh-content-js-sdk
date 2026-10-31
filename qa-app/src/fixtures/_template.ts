/**
 * Fixture template — copy this for each new ticket.
 *
 * This file is BOTH:
 *   1. Input for ensureFixtureExists() — creates content in CMS if missing
 *   2. Source of truth for test assertions — EXPECTED values come from here
 *
 * Naming: cms-{id}.ts (e.g. cms-56675.ts)
 */

export const CMS_XXXXX = {
  contentType: 'AutoStringAllFields',
  displayName: 'CMS_XXXXX_ShortDesc',
  locale: 'en',
  properties: {
    fullString: 'expected value here',
  },
  children: [
    // { displayName: 'CMS_XXXXX_ChildItem', locale: 'en', properties: { ... } },
  ],
};

export const EXPECTED = CMS_XXXXX.properties;
