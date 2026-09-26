import type { SiteConfig } from './types.js';

interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(config: SiteConfig): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token;
  }

  const tokenUrl = `${config.cmsApiUrl}/oauth/token`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    throw new Error(`OAuth token request failed: ${res.status} ${await res.text()}`);
  }

  const data: OAuthToken = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function getContentType(
  config: SiteConfig,
  key: string,
): Promise<any | null> {
  const token = await getAccessToken(config);
  const url = `${config.cmsApiUrl}/v1/contenttypes/${key}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GET /contenttypes/${key} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function listContentTypes(
  config: SiteConfig,
  filter?: string,
): Promise<any[]> {
  const token = await getAccessToken(config);
  let url = `${config.cmsApiUrl}/v1/contenttypes?pageSize=200`;
  if (filter) url += `&filter=${encodeURIComponent(filter)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`GET /contenttypes failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.items ?? [];
}

export async function deleteContentType(
  config: SiteConfig,
  key: string,
): Promise<boolean> {
  const token = await getAccessToken(config);
  const url = `${config.cmsApiUrl}/v1/contenttypes/${key}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok || res.status === 404;
}
