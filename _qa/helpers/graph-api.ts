import type { CmsPage, SiteConfig } from './types.js';

/**
 * Execute an arbitrary GraphQL query against Content Graph.
 * Returns the `data` portion of the response.
 */
export async function graphQuery(config: SiteConfig, query: string, variables?: Record<string, unknown>): Promise<any> {
  const endpoint = `${config.graphGateway}/content/v2?auth=${config.graphKey}`;
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

  const endpoint = `${config.graphGateway}/content/v2?auth=${config.graphKey}`;
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
