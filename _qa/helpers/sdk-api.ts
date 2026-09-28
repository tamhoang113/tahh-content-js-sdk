import type { SiteConfig } from './types.js';
import { findContentPathByDisplayName } from './graph-api.js';

export type SdkEndpoint = 'getContent' | 'getContentByPath' | 'getPreviewContent' | 'getPath' | 'getItems';

export interface SdkCallResult {
  data: any;
  queryLogs?: string[];
  graphUrl?: string;
  error?: string;
}

/**
 * Call an SDK public API via the QA API route (available in stride/alloy templates).
 *
 * The QA route at /qa/apis/run proxies calls to the SDK's GraphClient,
 * so this tests the real SDK code path — not raw GraphQL.
 *
 * Requires dev server running at config.baseUrl.
 */
export async function callSdkApi(
  config: SiteConfig,
  endpoint: SdkEndpoint,
  params: Record<string, string>,
  options?: { stored?: boolean },
): Promise<SdkCallResult> {
  const url = `${config.baseUrl}/qa/apis/run`;

  // Local dev servers (`next dev --experimental-https`) use a self-signed cert,
  // which Node's fetch rejects by default. Scope the TLS bypass to just this one
  // local call — never to real staging/production HTTPS endpoints (Graph, CMS API) —
  // and restore the previous setting right after, so it can't leak into other requests.
  const isLocalHttps = /^https:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(config.baseUrl);
  const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (isLocalHttps) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        params,
        stored: options?.stored ?? true,
      }),
    });
  } finally {
    if (isLocalHttps) {
      if (previousTlsSetting === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      else process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsSetting;
    }
  }

  const json = await res.json();

  if (!res.ok || json.error) {
    return {
      data: null,
      queryLogs: json.queryLogs,
      graphUrl: json.graphUrl,
      error: json.error ?? `HTTP ${res.status}`,
    };
  }

  return {
    data: json.data,
    queryLogs: json.queryLogs,
    graphUrl: json.graphUrl,
  };
}

/**
 * Shorthand: call getContentByPath and return the content array.
 */
export async function getContentByPath(config: SiteConfig, contentPath: string): Promise<any[]> {
  const result = await callSdkApi(config, 'getContentByPath', { path: contentPath });
  if (result.error) {
    throw new Error(`getContentByPath("${contentPath}") failed: ${result.error}`);
  }
  return result.data ?? [];
}

export interface ContentByDisplayNameResult {
  content: any;
  key: string;
  path: string;
  displayName: string;
}

/**
 * Resolve a content item by its stable CMS display name (via Graph), then fetch
 * it through getContentByPath — the real SDK code path — instead of hardcoding
 * a URL in test code. See QA_CONTEXT.md §6.1 for why: display names follow the
 * `CMS{id}_{ShortDesc}` fixture convention and rarely change, unlike URL paths.
 *
 * Throws a clear precondition error (not a silent empty result) if the display
 * name isn't found in Graph, or if the resolved path returns no content.
 */
export async function getContentByDisplayName(
  config: SiteConfig,
  displayName: string,
  envOverrideHint?: string,
): Promise<ContentByDisplayNameResult> {
  const lookup = await findContentPathByDisplayName(config, displayName);
  if (!lookup) {
    throw new Error(
      `No content found with displayName "${displayName}"${envOverrideHint ? ` — create the test page or set ${envOverrideHint}` : ''}`,
    );
  }

  const results = await getContentByPath(config, lookup.path);
  if (results.length === 0) {
    throw new Error(`No content at resolved path "${lookup.path}" (displayName "${displayName}")`);
  }

  return {
    content: results[0],
    key: lookup.key,
    path: lookup.path,
    displayName: lookup.displayName,
  };
}

/**
 * Shorthand: call getContent by key and return the result.
 */
export async function getContent(config: SiteConfig, key: string, locale?: string): Promise<any> {
  const params: Record<string, string> = { key };
  if (locale) params.locale = locale;
  const result = await callSdkApi(config, 'getContent', params);
  if (result.error) {
    throw new Error(`getContent("${key}") failed: ${result.error}`);
  }
  return result.data;
}

/**
 * Shorthand: call getItems and return children.
 */
export async function getItems(config: SiteConfig, pathOrKey: string): Promise<any[]> {
  const params: Record<string, string> = pathOrKey.startsWith('/') ? { path: pathOrKey } : { key: pathOrKey };
  const result = await callSdkApi(config, 'getItems', params);
  if (result.error) {
    throw new Error(`getItems("${pathOrKey}") failed: ${result.error}`);
  }
  return result.data ?? [];
}
