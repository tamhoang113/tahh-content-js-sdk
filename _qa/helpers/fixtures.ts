import type { SiteConfig } from './types.js';
import type {
  FixtureCase,
  ResolvedFixture,
  StoryFixtureDefinition,
} from '../fixtures/types.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findContentPathByDisplayName, findContentPathsByDisplayNames } from './graph-api.js';
import { createContent, findChildKeyByDisplayName, importPackage } from './content-api.js';

const QA_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Resolve a story's packageFile (relative to the `_qa` root) to an absolute path. */
function resolvePackagePath(packageFile: string): string {
  return path.isAbsolute(packageFile) ? packageFile : path.join(QA_ROOT, packageFile);
}

/**
 * Generic fixture ensure engine.
 *
 * Turns a story's fixture definition into real, queryable CMS content:
 *   - resolve each case by its stable identity (`automationId` == displayName)
 *   - if missing, create it via the Integration API
 *   - wait until Graph can serve it, then return a real `key`/`path`
 *
 * Tests consume the returned `key`/`path` — they never hardcode GUIDs, URL
 * paths, or display names. This is the single seam between "provision data" and
 * "assert SDK behaviour".
 */

export interface EnsureOptions {
  /** Parent container key (GUID) new content is created under. */
  container: string;
  /** Max time to wait for Graph to index newly created content (ms). */
  indexTimeoutMs?: number;
  /** Poll interval while waiting for Graph indexing (ms). */
  pollIntervalMs?: number;
}

const DEFAULT_INDEX_TIMEOUT_MS = 60_000;
const DEFAULT_POLL_INTERVAL_MS = 3_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Read the test container (parent) key from the environment.
 *
 * `loadSiteConfig` populates `process.env` from the site `.env`, so this works
 * after a config is loaded. Returns undefined if not set so callers can give a
 * clear precondition error.
 */
export function resolveTestContainer(ticket?: string): string | undefined {
  const storyKey = ticket
    ? `CMS_TEST_CONTAINER_${ticket.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`
    : undefined;
  return (
    (storyKey && process.env[storyKey]) ||
    process.env.CMS_TEST_CONTAINER ||
    undefined
  );
}

/** Resolve a case by its stable display name via Graph. */
async function resolveByIdentity(
  config: SiteConfig,
  displayName: string,
): Promise<ResolvedFixture | undefined> {
  const lookup = await findContentPathByDisplayName(config, displayName);
  if (!lookup) return undefined;
  return {
    automationId: displayName,
    key: lookup.key,
    path: lookup.path,
    displayName: lookup.displayName,
    created: false,
  };
}

/** Poll Graph until the content is queryable (indexing is eventually consistent). */
async function waitForIndex(
  config: SiteConfig,
  displayName: string,
  timeoutMs: number,
  pollMs: number,
): Promise<ResolvedFixture> {
  const deadline = Date.now() + timeoutMs;
  let last: ResolvedFixture | undefined;
  while (Date.now() < deadline) {
    last = await resolveByIdentity(config, displayName);
    if (last) return { ...last, created: true };
    await sleep(pollMs);
  }
  throw new Error(
    `Content "${displayName}" was created but did not become queryable in Graph within ${timeoutMs}ms`,
  );
}

/** Resolve many cases in a SINGLE Graph query. Returns map displayName -> fixture. */
async function resolveManyByIdentity(
  config: SiteConfig,
  displayNames: string[],
): Promise<Map<string, ResolvedFixture>> {
  const found = await findContentPathsByDisplayNames(config, displayNames);
  const out = new Map<string, ResolvedFixture>();
  for (const [name, lookup] of found) {
    out.set(name, {
      automationId: name,
      key: lookup.key,
      path: lookup.path,
      displayName: lookup.displayName,
      created: false,
    });
  }
  return out;
}

/** Poll (batched, one query per attempt) until ALL names are queryable. */
async function waitForIndexMany(
  config: SiteConfig,
  displayNames: string[],
  timeoutMs: number,
  pollMs: number,
): Promise<Map<string, ResolvedFixture>> {
  const deadline = Date.now() + timeoutMs;
  while (true) {
    const found = await resolveManyByIdentity(config, displayNames);
    if (found.size === displayNames.length) {
      const out = new Map<string, ResolvedFixture>();
      for (const [name, fx] of found) out.set(name, { ...fx, created: true });
      return out;
    }
    if (Date.now() >= deadline) {
      const missing = displayNames.filter((n) => !found.has(n));
      throw new Error(
        `Imported package but these did not become queryable within ${timeoutMs}ms: ${missing.join(', ')}`,
      );
    }
    await sleep(pollMs);
  }
}

/**
 * Ensure the per-feature container exists under the root container, creating it
 * once if missing, and return the container key that cases should be created
 * under. When the story has no `featureContainer`, cases go directly under the
 * root — so callers always pass just the single root GUID.
 *
 * Resolution goes through the Integration API (list the root's children, match
 * by display name), which returns the key directly and does not depend on Graph
 * indexing — containers like a BlankExperience don't reliably surface by display
 * name in Graph.
 */
async function ensureFeatureContainer(
  config: SiteConfig,
  def: StoryFixtureDefinition,
  rootContainer: string,
): Promise<string> {
  if (!def.featureContainer) return rootContainer;

  const { contentTypeKey } = def.featureContainer;
  // Keep the CMS folder name consistent with the TSX / package file names.
  const displayName = def.featureContainer.displayName ?? def.slug;

  const existing = await findChildKeyByDisplayName(
    config,
    rootContainer,
    displayName,
    contentTypeKey,
  );
  if (existing) return existing;

  const created = await createContent(config, {
    contentTypeKey,
    container: rootContainer,
    displayName,
    locale: def.locale,
    publish: true,
  });
  return created.key;
}

/**
 * Ensure a single fixture case exists and is queryable, creating it if missing.
 * Idempotent: if the content already exists (by display name), it is reused.
 */
export async function ensureFixture(
  config: SiteConfig,
  def: StoryFixtureDefinition,
  fixtureCase: FixtureCase,
  options: EnsureOptions,
): Promise<ResolvedFixture> {
  const displayName = fixtureCase.automationId;

  const existing = await resolveByIdentity(config, displayName);
  if (existing) return existing;

  await createContent(config, {
    contentTypeKey: def.contentTypeKey,
    container: options.container,
    displayName,
    locale: def.locale,
    properties: fixtureCase.properties,
    categories: fixtureCase.categories,
    publish: true,
  });

  return waitForIndex(
    config,
    displayName,
    options.indexTimeoutMs ?? DEFAULT_INDEX_TIMEOUT_MS,
    options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS,
  );
}

/**
 * Ensure every case in a story definition. Returns a map keyed by the same case
 * ids used in the definition, so test code can do `fixtures.oneTaxonomy.key`.
 *
 * Provisioning follows `def.provision` (default `'create'`):
 *   - `'create'`  — build each case via the Integration API (simple content).
 *   - `'package'` — import a committed `.episerverdata` once, then resolve all.
 *   - `'manual'`  — resolve only; fail with a recipe if any case is missing.
 */
export async function ensureStoryFixtures<
  TCases extends Record<string, FixtureCase>,
>(
  config: SiteConfig,
  def: StoryFixtureDefinition<TCases>,
  options: EnsureOptions,
): Promise<Record<keyof TCases, ResolvedFixture>> {
  const entries = Object.entries(def.cases) as [keyof TCases, FixtureCase][];
  const resolved = {} as Record<keyof TCases, ResolvedFixture>;

  const indexTimeoutMs = options.indexTimeoutMs ?? DEFAULT_INDEX_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const strategy = def.provision ?? 'create';

  if (strategy === 'manual') {
    // Resolve only — never create. One batched query; fail with a recipe if
    // anything is missing.
    const names = entries.map(([, c]) => c.automationId);
    const found = await resolveManyByIdentity(config, names);
    for (const [caseId, fixtureCase] of entries) {
      const existing = found.get(fixtureCase.automationId);
      if (!existing) {
        throw new Error(
          `[fixture:manual] "${fixtureCase.automationId}" (${def.contentTypeKey}) not found. ` +
            `Create it in the CMS UI with that display name, then re-run.`,
        );
      }
      resolved[caseId] = existing;
    }
    return resolved;
  }

  if (strategy === 'package') {
    // Package placement is baked into the .episerverdata, so there is NO feature
    // container for package mode — import targets the root (Auto) container
    // directly. One batched Graph query resolves all cases; import only runs if
    // something is missing (all-or-nothing package).
    const names = entries.map(([, c]) => c.automationId);
    const found = await resolveManyByIdentity(config, names);
    const missing = entries.filter(([, c]) => !found.has(c.automationId));

    if (missing.length > 0) {
      // Default the package path from the slug so it matches the TSX file name.
      const packageFile =
        def.packageFile ?? `fixtures/packages/${def.slug}.episerverdata`;
      await importPackage(config, resolvePackagePath(packageFile), {
        container: options.container,
        overwrite: true,
        locale: def.locale,
      });
      const nowResolved = await waitForIndexMany(
        config,
        missing.map(([, c]) => c.automationId),
        indexTimeoutMs,
        pollIntervalMs,
      );
      for (const [caseId, fixtureCase] of missing) {
        resolved[caseId] = nowResolved.get(fixtureCase.automationId)!;
      }
    }

    // Fill in the cases that were already present from the batched resolve.
    for (const [caseId, fixtureCase] of entries) {
      if (!resolved[caseId]) resolved[caseId] = found.get(fixtureCase.automationId)!;
    }
    return resolved;
  }

  // 'create' (default) — derive the per-feature container under the root so only
  // one GUID is ever required, then create each case under it.
  const container = await ensureFeatureContainer(config, def, options.container);

  // Sequential on purpose: creating + waiting for index in parallel can hammer
  // the Integration API and Graph; keep it predictable.
  for (const [caseId, fixtureCase] of entries) {
    resolved[caseId] = await ensureFixture(config, def, fixtureCase, {
      container,
      indexTimeoutMs,
      pollIntervalMs,
    });
  }

  return resolved;
}
