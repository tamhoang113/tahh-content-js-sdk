import type { SiteConfig } from './types.js';

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
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint,
      params,
      stored: options?.stored ?? true,
    }),
  });

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
