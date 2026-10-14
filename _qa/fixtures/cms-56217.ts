import type { StoryFixtureDefinition, FixtureCase } from './types.js';

/**
 * CMS-56217 — Taxonomy categories support in @optimizely/cms-sdk.
 *
 * Single source of truth for the taxonomy test data. Each case is a different
 * instance of the SAME content type (`CMS56217TaxonomyPage`), distinguished by
 * the taxonomy categories assigned to it. The `automationId` names the case and
 * is also used as the CMS display name so tests can resolve it to a real
 * `key`/`path` at runtime.
 *
 * Content type source of truth (code-first):
 *   samples/nextjs-template/src/qa/CMS_56217_TaxonomyCategories.tsx
 *
 * Prerequisite (NOT created by the seed): the taxonomy category TERMS below must
 * already exist in the CMS Category Admin / taxonomy tree. The seed only assigns
 * existing terms to content; it does not create the taxonomy tree itself.
 */

const CONTENT_TYPE_KEY = 'CMS56217TaxonomyPage';

// Taxonomy term keys expected to exist on the site (align with Category Admin).
// These match the real term keys indexed by Graph (e.g.
// `cms://taxonomy/categories/Taxanomy`) — note the site spells them "Taxanomy".
const TERMS = {
  taxonomy: 'Taxanomy',
  level3: 'Taxanomy_Level3',
  internal: 'Taxanomy_Internal',
} as const;

const HIERARCHY_PATH = [
  { key: 'Auto', displayName: 'Auto', taxonomy: 'categories', usage: 'Public' },
  { key: 'Taxanomy', displayName: 'Taxanomy', taxonomy: 'categories', usage: 'Public' },
  { key: 'Taxanomy_Level2', displayName: 'Taxanomy Level2', taxonomy: 'categories', usage: 'Public' },
  { key: 'Taxanomy_Level3', displayName: 'Taxanomy Level3', taxonomy: 'categories', usage: 'Public' },
] as const;

const cases = {
  /** A page with exactly one category assigned. */
  oneTaxonomy: {
    automationId: 'CMS_56217_One_Taxonomy',
    properties: {
      title: 'CMS56217 One Taxonomy',
      description: 'Page assigned to a single taxonomy category.',
    },
    categories: [TERMS.taxonomy],
    expected: {
      rawCategoryCount: 1,
      resolvedTermKeys: [TERMS.taxonomy],
    },
  },

  /** A page with multiple categories across different branches. */
  multiTaxonomy: {
    automationId: 'CMS_56217_Multi_Taxonomy',
    properties: {
      title: 'CMS56217 Multi Taxonomy',
      description: 'Page assigned to multiple taxonomy categories.',
    },
    categories: [TERMS.taxonomy, TERMS.internal],
    expected: {
      rawCategoryCount: 2,
      resolvedTermKeys: [TERMS.taxonomy, TERMS.internal],
    },
  },

  /** A page assigned to a deeply nested term (for breadcrumb/hierarchy). */
  multiHierarchical: {
    automationId: 'CMS_56217_Multi_Hierarchical_Taxonomy',
    properties: {
      title: 'CMS56217 Multi Hierarchical Taxonomy',
      description: 'Page assigned to a nested taxonomy category (hierarchy).',
    },
    categories: [TERMS.level3],
    expected: {
      rawCategoryCount: 1,
      hasHierarchy: true,
      resolvedTermKeys: [TERMS.level3],
      resolvedDisplayName: 'Taxanomy Level3',
      resolvedTaxonomy: 'categories',
      resolvedUsage: 'Public',
      hierarchyPath: HIERARCHY_PATH,
    },
  },

  /** A page with no categories assigned (empty-array case). */
  noTaxonomy: {
    automationId: 'CMS_56217_No_Taxonomy',
    properties: {
      title: 'CMS56217 No Taxonomy',
      description: 'Page with no taxonomy categories assigned.',
    },
    categories: [],
    expected: {
      rawCategoryCount: 0,
    },
  },
} satisfies Record<string, FixtureCase>;

export const CMS_56217: StoryFixtureDefinition<typeof cases> = {
  ticket: 'CMS-56217',
  // Canonical slug == TSX base name (CMS_56217_TaxonomyCategories.tsx). The
  // engine derives the package file path (fixtures/packages/{slug}.episerverdata)
  // from this.
  slug: 'CMS_56217_TaxonomyCategories',
  contentTypeKey: CONTENT_TYPE_KEY,
  baseType: '_page',
  locale: 'en',
  // Provisioned by importing a committed package (taxonomy terms + the 4 pages
  // that use them) — the term tree is a precondition `create` can't build, so
  // the package bundles both. Import targets the root (Auto) container; no
  // feature container is created in package mode.
  provision: 'package',
  cases,
};

export type CMS56217CaseId = keyof typeof cases;
