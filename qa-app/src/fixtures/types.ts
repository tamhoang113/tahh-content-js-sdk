/**
 * Story-based test fixtures — shared shape.
 *
 * A "story fixture" describes the test data a user story needs on a live CMS
 * site, so tests no longer depend on data added by hand. The same definition is
 * consumed by three places:
 *   1. ensure/seed — check existence, create what's missing (via Integration API)
 *   2. test scripts — resolve each case to a real `key`/`path` and assert behaviour
 *   3. humans — read the catalog to understand what each case represents
 *
 * The `automationId` is the single stable identity for a case. It is also used
 * as the CMS `displayName` so the existing Graph lookup
 * (`findContentPathByDisplayName`) can resolve it to a real `key`/`path` at
 * runtime — tests never hardcode a GUID or a URL path.
 */

/** One concrete content instance for a test case. */
export interface FixtureCase {
  /**
   * Stable, unique, human-readable identity for this case, e.g.
   * `CMS_56217_One_Taxonomy`. Doubles as the CMS `displayName` used to resolve
   * the created content back to a `key`/`path`. Must be unique within a story.
   */
  automationId: string;

  /** Regular content-type property values (e.g. `title`, `description`). */
  properties?: Record<string, unknown>;

  /**
   * Taxonomy category term keys to assign to this content, e.g.
   * `['Taxonomy', 'Taxonomy_Internal']`. Empty/omitted means "no categories".
   * The category terms themselves are a prerequisite that must already exist in
   * the CMS (see the story's README/notes).
   */
  categories?: string[];

  /**
   * Expected values the tests assert against. Opaque to the ensure engine —
   * only test scripts read this. Keeping it next to the seed data makes each
   * case self-describing and avoids drift between "what we create" and "what we
   * assert".
   */
  expected?: Record<string, unknown>;
}

/** How a story's fixture content is provisioned when missing. */
export type ProvisionStrategy =
  /** Build each case via the Integration API (simple content). Default. */
  | 'create'
  /** Import a committed `.episerverdata` package (complex content). */
  | 'package'
  /** Resolve by identity only; fail with a recipe if missing (no creation). */
  | 'manual';

/** The full set of fixtures a single user story needs. */
export interface StoryFixtureDefinition<
  TCases extends Record<string, FixtureCase> = Record<string, FixtureCase>,
> {
  /** JIRA ticket id, e.g. `CMS-56217`. */
  ticket: string;

  /**
   * Canonical feature slug — the single source for naming. Equals the TSX
   * component base name, e.g. `CMS_56217_TaxonomyCategories`. The engine derives
   * the package file name (`fixtures/packages/{slug}.episerverdata`) and the
   * feature container display name from it, so those stay consistent without
   * being re-typed.
   */
  slug: string;

  /**
   * Content type key the cases are instances of. Must match the code-first
   * content type declared in the sample app (single source of truth for the
   * schema). Kept as a string here so the seed script stays a plain Node module
   * and does not pull in React/server deps from the sample.
   */
  contentTypeKey: string;

  /** Base type of the content type (e.g. `_page`). */
  baseType: string;

  /** Locale the fixtures are created in. */
  locale: string;

  /**
   * How missing content is provisioned. Defaults to `'create'`.
   * - `'create'` — Integration API create per case (simple content).
   * - `'package'` — import `packageFile` once (complex content built in the UI).
   * - `'manual'` — resolve only; fail with a recipe if any case is missing.
   */
  provision?: ProvisionStrategy;

  /**
   * For `provision: 'package'` — path to the committed `.episerverdata` file,
   * relative to the `_qa` root. Defaults to
   * `fixtures/packages/{slug}.episerverdata` when omitted.
   */
  packageFile?: string;

  /**
   * Optional per-feature container. When set, the ensure engine creates (once)
   * a dedicated container under the root `CMS_TEST_CONTAINER` and places all
   * cases under it — so callers only ever supply ONE root GUID (e.g. "Auto")
   * and each feature gets its own isolated folder automatically. When omitted,
   * cases are created directly under the root container.
   *
   * `displayName` defaults to the story `slug` when omitted, keeping the CMS
   * folder name consistent with the TSX / package file names.
   */
  featureContainer?: {
    /** Display name of the container. Defaults to the story `slug`. */
    displayName?: string;
    /** Content type to create the container as (e.g. `BlankExperience`). */
    contentTypeKey: string;
  };

  /** Named cases, keyed by a logical id used by test code. */
  cases: TCases;
}

/** What `ensureFixture()` resolves a case to at runtime. */
export interface ResolvedFixture {
  automationId: string;
  /** Real CMS content key (GUID) — preferred identity for `getContent`. */
  key: string;
  /** Resolved URL path — used only when the API under test is path-based. */
  path: string;
  /** The display name the content was created/found with. */
  displayName: string;
  /** Whether the ensure step created the content in this run. */
  created: boolean;
}
