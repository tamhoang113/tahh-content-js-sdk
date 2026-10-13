import type { SiteConfig } from './types.js';
import { getAccessToken } from './cms-api.js';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

/**
 * Media type for an `.episerverdata` CMS data package (export/import format).
 * Import is `POST /v1/experimental/packages` with this Content-Type and the
 * package (a zip) as the raw body.
 */
export const PACKAGE_MEDIA_TYPE = 'application/vnd.episerver.cms.data';

/**
 * Integration API — content item operations used to provision test fixtures.
 *
 * `cms-api.ts` covers content-TYPE operations; this module covers content ITEM
 * create/read so the ensure/seed layer can provision test data instead of
 * relying on content added by hand.
 *
 * Payload shape follows Integration API v1 (`NewContent`): `displayName`,
 * `locale`, and `properties` live inside `initialVersion`; content is created as
 * Draft and published via a separate `:publish` call.
 */

export interface CreateContentInput {
  /** Content type key (e.g. `CMS56217TaxonomyPage`). */
  contentTypeKey: string;
  /** Parent container key (GUID). Required by the Integration API. */
  container: string;
  /** Display name — also the stable lookup key used by tests. */
  displayName: string;
  /** Locale, e.g. `en`. */
  locale: string;
  /** Regular content-type property values. */
  properties?: Record<string, unknown>;
  /** Taxonomy category term keys to assign. */
  categories?: string[];
  /** Publish after creation so Graph indexes it. Defaults to true. */
  publish?: boolean;
  /** Content key (GUID). Generated if omitted. */
  key?: string;
}

export interface CreatedContent {
  key: string;
  displayName: string;
  status: string;
  raw: any;
}

/** CMS content keys are 32-hex GUIDs without dashes. */
function newContentKey(): string {
  return randomUUID().replace(/-/g, '');
}

/**
 * Integration API v1 wraps each property value as `{ value: ... }` rather than a
 * raw scalar. Transform a flat property map into that shape.
 */
function wrapProperties(
  properties: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!properties) return {};
  return Object.fromEntries(
    Object.entries(properties).map(([k, v]) => [k, { value: v }]),
  );
}

/**
 * Build the taxonomy-category property entry for the create payload.
 *
 * Taxonomy categories are modelled as a `categories` PROPERTY on the content
 * version, wrapped like any other property (`{ value: [...] }`), and the values
 * are full term URIs (`cms://taxonomy/categories/<key>`), not bare keys. This
 * matches what the Integration API returns for a categorized item. Bare keys
 * passed by fixtures are normalized to URIs; values already in URI form are kept.
 */
function toCategoryUri(keyOrUri: string): string {
  return keyOrUri.startsWith('cms://')
    ? keyOrUri
    : `cms://taxonomy/categories/${keyOrUri}`;
}

function buildCategoryProperty(
  categories: string[] | undefined,
): Record<string, unknown> {
  if (!categories || categories.length === 0) return {};
  return { categories: { value: categories.map(toCategoryUri) } };
}

/** Fetch a content item by key via the Integration API. Returns null on 404. */
export async function getContentByKeyApi(
  config: SiteConfig,
  key: string,
): Promise<any | null> {
  const token = await getAccessToken(config);
  const url = `${config.cmsApiUrl}/v1/content/${key}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GET /content/${key} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/** List direct children of a container. Returns `[{ key, contentType }]`. */
export async function listChildren(
  config: SiteConfig,
  containerKey: string,
): Promise<Array<{ key: string; contentType: string }>> {
  const token = await getAccessToken(config);
  const url = `${config.cmsApiUrl}/v1/content/${containerKey.replace(/-/g, '')}/items?pageSize=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`GET /content/${containerKey}/items failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return (data.items ?? []).map((i: any) => ({ key: i.key, contentType: i.contentType }));
}

/** The latest version's display name for a content item (via /versions). */
export async function getLatestDisplayName(
  config: SiteConfig,
  key: string,
): Promise<string | undefined> {
  const token = await getAccessToken(config);
  const url = `${config.cmsApiUrl}/v1/content/${key}/versions?pageSize=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return undefined;
  const data = await res.json();
  return data.items?.[0]?.displayName;
}

/**
 * Find a direct child of a container by display name (and optionally content
 * type), returning its key. Resolves entirely through the Integration API, so
 * it does not depend on Graph indexing — the reliable idempotency source for
 * container items (e.g. an Experience used as a feature folder).
 */
export async function findChildKeyByDisplayName(
  config: SiteConfig,
  containerKey: string,
  displayName: string,
  contentType?: string,
): Promise<string | undefined> {
  const children = await listChildren(config, containerKey);
  for (const child of children) {
    if (contentType && child.contentType !== contentType) continue;
    const name = await getLatestDisplayName(config, child.key);
    if (name === displayName) return child.key;
  }
  return undefined;
}

/** Publish a specific version of a content item. */
async function publishVersion(
  config: SiteConfig,
  token: string,
  key: string,
  version: string,
): Promise<void> {
  const url = `${config.cmsApiUrl}/v1/content/${key}/versions/${version}:publish`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(
      `publish ${key}@${version} failed: ${res.status} ${await res.text()}`,
    );
  }
}

/**
 * Create a content item via the Integration API, optionally publishing it so it
 * becomes queryable through Graph.
 */
export async function createContent(
  config: SiteConfig,
  input: CreateContentInput,
): Promise<CreatedContent> {
  const token = await getAccessToken(config);
  const publish = input.publish ?? true;
  const key = input.key ?? newContentKey();

  const initialVersion: Record<string, unknown> = {
    displayName: input.displayName,
    locale: input.locale,
    properties: {
      ...wrapProperties(input.properties),
      // Taxonomy categories are a content property (URI list), not a separate
      // item-level field.
      ...buildCategoryProperty(input.categories),
    },
  };

  const body = {
    key,
    contentType: input.contentTypeKey,
    // CMS keys are 32-hex GUIDs without dashes; accept a dashed UUID too.
    container: input.container.replace(/-/g, ''),
    initialVersion,
  };

  const url = `${config.cmsApiUrl}/v1/content`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `POST /content failed for "${input.displayName}": ${res.status} ${await res.text()}`,
    );
  }

  const raw = await res.json();
  const createdKey = raw.key ?? key;
  const version =
    raw.initialVersion?.version ?? raw.version ?? 'draft';

  if (publish) {
    await publishVersion(config, token, createdKey, String(version));
  }

  return {
    key: createdKey,
    displayName: raw.initialVersion?.displayName ?? input.displayName,
    status: publish ? 'published' : 'draft',
    raw,
  };
}

export interface ImportPackageOptions {
  /** Target container key new content is created under. */
  container?: string;
  /**
   * When true, content with a matching key is overwritten (upsert) — idempotent
   * re-imports. When false, the API always creates NEW items under `container`
   * regardless of key (duplicates on re-import). Defaults to true.
   */
  overwrite?: boolean;
  /**
   * Apply the package even when its changes are flagged as potentially breaking
   * (data loss). Maps to `IgnoreDataLossWarnings`. Defaults to false.
   */
  ignoreDataLossWarnings?: boolean;
  /** Restrict import to a single locale. Omit to import all locales. */
  locale?: string;
}

/**
 * Import an `.episerverdata` package via the packages endpoint.
 *
 * `POST /v1/experimental/packages` with `Content-Type: application/vnd.episerver.cms.data`
 * and the package file (a zip) as the raw body. The package self-contains the
 * content type(s) AND content instance(s). Target placement and upsert behaviour
 * are controlled via query options (`Container`, `OverwriteExistingContentItems`,
 * `IgnoreDataLossWarnings`, `Locale`). Returns the import outcome
 * `{ success, outcomes, errors, warnings }`.
 *
 * The endpoint returns HTTP 200 even when the import FAILS (`success: false`),
 * so this throws on `success === false` to surface errors instead of letting a
 * failed import look like a success.
 *
 * Note: this CMS supports package IMPORT only (not export via API) — build the
 * content in the UI and export from there to produce the committed package file.
 */
export async function importPackage(
  config: SiteConfig,
  filePath: string,
  options: ImportPackageOptions = {},
): Promise<any> {
  const token = await getAccessToken(config);
  const data = await readFile(filePath);

  const params = new URLSearchParams();
  if (options.container) params.set('Container', options.container.replace(/-/g, ''));
  params.set('OverwriteExistingContentItems', String(options.overwrite ?? true));
  if (options.ignoreDataLossWarnings) params.set('IgnoreDataLossWarnings', 'true');
  if (options.locale) params.set('Locale', options.locale);

  const url = `${config.cmsApiUrl}/v1/experimental/packages?${params.toString()}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': PACKAGE_MEDIA_TYPE,
      Accept: 'application/json',
    },
    body: data,
  });

  if (!res.ok) {
    throw new Error(
      `import package "${filePath}" failed: ${res.status} ${await res.text()}`,
    );
  }

  const result = await res.json();
  if (result?.success === false) {
    const errors = (result.errors ?? [])
      .map((e: any) => `${e.section ? `[${e.section}] ` : ''}${e.message}`)
      .join('; ');
    throw new Error(`import package "${filePath}" reported failure: ${errors}`);
  }
  return result;
}

