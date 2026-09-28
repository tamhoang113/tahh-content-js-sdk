import type { CmsPage, SiteConfig } from './types.js';

export interface ContentLookupResult {
  key: string;
  displayName: string;
  path: string;
  types: string[];
}

/**
 * Build the Content Graph query endpoint, appending `/content/v2` only if the
 * configured gateway doesn't already include it (some .env files set the
 * gateway with the suffix already, some without — mirrors the SDK's own
 * normalizeGraphUrl behavior from CMS-54607).
 */
function buildGraphEndpoint(config: SiteConfig): string {
  const base = config.graphGateway.replace(/\/$/, '');
  const withSuffix = base.endsWith('/content/v2') ? base : `${base}/content/v2`;
  return `${withSuffix}?auth=${config.graphKey}`;
}

/**
 * Execute an arbitrary GraphQL query against Content Graph.
 * Returns the `data` portion of the response.
 */
export async function graphQuery(config: SiteConfig, query: string, variables?: Record<string, unknown>): Promise<any> {
  const endpoint = buildGraphEndpoint(config);
  const body: Record<string, unknown> = { query };
  if (variables) body.variables = variables;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Graph API ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

/**
 * Fetch all pages under the start page via Content Graph API.
 */
export async function fetchSitePages(
  config: SiteConfig,
  ancestorPath = '/en',
): Promise<CmsPage[]> {
  const query = `{
    _Content(
      where: {
        _ancestors: { in: ["${ancestorPath}"] }
        _metadata: { types: { in: ["_Page"] } }
      }
      limit: 100
      orderBy: { _metadata: { url: { default: ASC } } }
    ) {
      items {
        __typename
        _metadata {
          key
          displayName
          url { default hierarchical }
        }
      }
    }
  }`;

  const endpoint = buildGraphEndpoint(config);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`Graph API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const items = json?.data?._Content?.items ?? [];

  return items
    .map((item: any) => ({
      key: item._metadata?.key ?? '',
      name: item._metadata?.displayName ?? item.__typename,
      url: item._metadata?.url?.default ?? item._metadata?.url?.hierarchical ?? '',
      typename: item.__typename,
    }))
    .filter((p: CmsPage) => p.url);
}

/**
 * Resolve a content item's current published path by its display name.
 *
 * Display names follow the QA fixture convention (`CMS{id}_{ShortDesc}`) and are
 * set once when the test content is created, whereas URL paths can be recomputed
 * when content is moved in the tree (hierarchical URLs depend on ancestors).
 * Looking content up by display name avoids hardcoding a path in test code that
 * can silently go stale after a content reorg — only the (stable) display name
 * needs to match.
 */
export async function findContentPathByDisplayName(
  config: SiteConfig,
  displayName: string,
): Promise<ContentLookupResult | undefined> {
  const query = `query($displayName: String!) {
    _Content(
      where: { _metadata: { displayName: { eq: $displayName } } }
      limit: 1
    ) {
      items {
        __typename
        _metadata {
          key
          displayName
          types
          url { default hierarchical }
        }
      }
    }
  }`;

  const data = await graphQuery(config, query, { displayName });
  const item = data?._Content?.items?.[0];
  if (!item) return undefined;

  const path = item._metadata?.url?.default ?? item._metadata?.url?.hierarchical;
  if (!path) return undefined;

  return {
    key: item._metadata.key ?? '',
    displayName: item._metadata.displayName ?? displayName,
    path,
    types: item._metadata.types ?? [],
  };
}
