/**
 * CMS-56227: Pluggable Graph authentication — SDK API verification
 *
 * Feature: adds `auth` option to GraphClient/config()/getClient() enabling
 * HMAC, bearer, and custom resolver authentication modes. Also adds
 * `publishedOnly` filter (default true) and `asUser` impersonation headers.
 *
 * Test strategy:
 *   - Group 1 (unit-style): Verify the public auth API surface compiles and
 *     behaves correctly — config validation, client construction, caching
 *     defaults. These import `@optimizely/cms-sdk` directly and do NOT
 *     need a running dev server.
 *   - Group 2 (integration): Verify `publishedOnly` filter through the
 *     live SDK route (`callSdkApi`). Needs dev server running.
 *
 * Prerequisites:
 *   Group 1: none (pure SDK tests)
 *   Group 2:
 *     1. Dev server running:    cd samples/nextjs-template && pnpm dev
 *     2. Published content exists (any type)
 *
 * Run:
 *   pnpm test:sdk -- cms-56227
 */

import { describe, test, expect } from 'vitest';
import {
  GraphClient,
  config,
  getClient,
} from '../../../packages/optimizely-cms-sdk/dist/cjs/index.js';
import type {
  GraphSecrets,
} from '../../../packages/optimizely-cms-sdk/dist/cjs/index.js';
import { loadSiteConfig } from '../../helpers/config.js';
import { callSdkApi } from '../../helpers/sdk-api.js';
import { findContentPathByDisplayName } from '../../helpers/graph-api.js';

const siteConfig = loadSiteConfig('nextjs-template');

const SECRETS: GraphSecrets = {
  appKey: siteConfig.graphAppKey,
  secret: siteConfig.graphSecret,
};

const GRAPH_URL = siteConfig.graphGateway;
const SINGLE_KEY = siteConfig.graphKey;

const DRAFT_DISPLAY_NAME =
  process.env.CMS56227_DRAFT_DISPLAY_NAME ?? 'one draft version';

const RESTRICTED_PAGES = {
  userOnly: process.env.CMS56227_USER_RESTRICTED_PAGE ?? 'only_user_auto1_has_read_right',
  roleOnly: process.env.CMS56227_ROLE_RESTRICTED_PAGE ?? 'only_content_admin_has_read_right',
};

// ─── Group 1: Auth Configuration API (no server needed) ─────────────────────

describe('CMS-56227: Auth Configuration API', () => {

  // ── 1.1 Default behavior — single key, unchanged ──────────────────────────

  describe('[TC-001] single key fallback (no auth)', () => {
    test('GraphClient without auth uses single key defaults', () => {
      const client = new GraphClient('test-key-56227');
      expect(client.queryDefaults.cache).toBe(true);
      expect(client.queryDefaults.stored).toBe(true);
      expect(client.queryDefaults.publishedOnly).toBe(true);
    });

    test('secrets alone do not change caching behavior', () => {
      const client = new GraphClient('test-key-56227', { secrets: SECRETS });
      expect(client.queryDefaults.cache).toBe(true);
      expect(client.queryDefaults.stored).toBe(true);
    });
  });

  // ── 1.2 Auth disables caching ─────────────────────────────────────────────

  describe('[TC-002] caching defaults with auth', () => {
    test('hmac mode turns off cache and stored queries', () => {
      const client = new GraphClient('test-key-56227', {
        auth: { type: 'hmac' },
        secrets: SECRETS,
      });
      expect(client.queryDefaults.cache).toBe(false);
      expect(client.queryDefaults.stored).toBe(false);
    });

    test('bearer mode turns off cache and stored queries', () => {
      const client = new GraphClient('test-key-56227', {
        auth: { type: 'bearer', token: 'test-jwt' },
      });
      expect(client.queryDefaults.cache).toBe(false);
      expect(client.queryDefaults.stored).toBe(false);
    });

    test('resolver function turns off cache and stored queries', () => {
      const client = new GraphClient('test-key-56227', {
        auth: () => ({ Authorization: 'Bearer test' }),
      });
      expect(client.queryDefaults.cache).toBe(false);
      expect(client.queryDefaults.stored).toBe(false);
    });

    test('explicit cache:true overrides auth default', () => {
      const client = new GraphClient('test-key-56227', {
        auth: { type: 'bearer', token: 'test-jwt' },
        query: { cache: true },
      });
      expect(client.queryDefaults.cache).toBe(true);
    });
  });

  // ── 1.3 publishedOnly defaults ────────────────────────────────────────────

  describe('[TC-003] publishedOnly default', () => {
    test('publishedOnly is true by default', () => {
      const client = new GraphClient('test-key-56227');
      expect(client.queryDefaults.publishedOnly).toBe(true);
    });

    test('publishedOnly can be set to false per client', () => {
      const client = new GraphClient('test-key-56227', {
        query: { publishedOnly: false },
      });
      expect(client.queryDefaults.publishedOnly).toBe(false);
    });
  });

  // ── 1.4 Configuration validation ──────────────────────────────────────────

  describe('[TC-004] configuration validation', () => {
    test('rejects hmac without secrets', () => {
      expect(
        () => new GraphClient('test-key-56227', { auth: { type: 'hmac' } }),
      ).toThrow();
    });

    test('rejects hmac with missing appKey', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'hmac' },
            secrets: { appKey: '', secret: 'dGVzdA==' },
          }),
      ).toThrow();
    });

    test('rejects hmac with missing secret', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'hmac' },
            secrets: { appKey: 'key', secret: '' },
          }),
      ).toThrow();
    });

    test('rejects bearer with empty token', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'bearer', token: '' },
          }),
      ).toThrow();
    });

    test('rejects unknown auth type', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'oauth' } as any,
            secrets: SECRETS,
          }),
      ).toThrow();
    });

    test('rejects basic auth type (points to hmac)', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'basic' } as any,
          }),
      ).toThrow(/hmac/);
    });

    test('accepts bearer with callback token', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'bearer', token: () => 'lazy-token' },
          }),
      ).not.toThrow();
    });

    test('accepts hmac with valid secrets', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'hmac' },
            secrets: SECRETS,
          }),
      ).not.toThrow();
    });

});

  // ── 1.5 asUser validation ─────────────────────────────────────────────────

  describe('[TC-005] asUser validation', () => {
    test('rejects hmac with empty asUser literal', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'hmac', asUser: {} },
            secrets: SECRETS,
          }),
      ).toThrow();
    });

    test('accepts hmac with username in asUser', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'hmac', asUser: { username: 'test-user' } },
            secrets: SECRETS,
          }),
      ).not.toThrow();
    });

    test('accepts hmac with roles in asUser', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: { type: 'hmac', asUser: { roles: ['WebDelivery'] } },
            secrets: SECRETS,
          }),
      ).not.toThrow();
    });

    test('accepts hmac with asUser callback', () => {
      expect(
        () =>
          new GraphClient('test-key-56227', {
            auth: {
              type: 'hmac',
              asUser: () => ({ username: 'dynamic-user' }),
            },
            secrets: SECRETS,
          }),
      ).not.toThrow();
    });
  });

  // ── 1.6 config() accepts auth options ─────────────────────────────────────

  describe('[TC-006] config() with auth', () => {
    test('config() accepts secrets without auth (no-op until mode is chosen)', () => {
      expect(() =>
        config({
          apiKey: 'config-test-key-56227',
          secrets: SECRETS,
        }),
      ).not.toThrow();
    });

    test('config() rejects invalid auth same as GraphClient', () => {
      expect(() =>
        config({
          apiKey: 'config-test-key-56227',
          auth: { type: 'hmac' },
          // no secrets
        }),
      ).toThrow();
    });

    test('getClient() with per-request auth override works', () => {
      config({ apiKey: 'config-test-key-56227', secrets: SECRETS });

      const client = getClient({
        auth: { type: 'hmac', asUser: { username: 'per-request-user' } },
      });
      expect(client).toBeTruthy();
      expect(client.queryDefaults.cache).toBe(false);
    });

    test('getClient() without auth stays on single key defaults', () => {
      config({ apiKey: 'config-test-key-56227' });

      const client = getClient();
      expect(client.queryDefaults.cache).toBe(true);
      expect(client.queryDefaults.stored).toBe(true);
    });
  });

});

// ─── Group 2: publishedOnly via live SDK (needs dev server) ─────────────────

describe('[TC-007] CMS-56227: publishedOnly Integration', () => {
  const TEST_DISPLAY_NAME =
    process.env.CMS56227_TEST_DISPLAY_NAME ?? 'CMS56675_LocaleFallback_nl';

  let contentPath: string;

  test('resolve test content by displayName', async () => {
    const lookup = await findContentPathByDisplayName(siteConfig, TEST_DISPLAY_NAME);
    expect(
      lookup,
      `No content found with displayName "${TEST_DISPLAY_NAME}" — ` +
        'create the test page or set CMS56227_TEST_DISPLAY_NAME',
    ).toBeTruthy();
    contentPath = lookup!.path;
    expect(contentPath).toBeTruthy();
  });

  test('getContentByPath returns published content by default (publishedOnly=true)', async () => {
    const result = await callSdkApi(siteConfig, 'getContentByPath', {
      path: contentPath,
    });

    expect(result.error).toBeFalsy();
    expect(result.data).toBeTruthy();
  });

  test('getContentByPath with stored=false works under default auth (single key)', async () => {
    const result = await callSdkApi(
      siteConfig,
      'getContentByPath',
      { path: contentPath },
      { stored: false },
    );

    expect(result.error).toBeFalsy();
    expect(result.data).toBeTruthy();
  });
});

// ─── Group 3: Real HMAC/Bearer auth against live Graph (needs credentials) ──

const QUERY = 'query Test { _Content(limit:1) { total items { _metadata { key displayName status } } } }';

async function graphRequest(
  client: InstanceType<typeof GraphClient>,
  query: string,
): Promise<any> {
  return client.request(query, {}, undefined, false, undefined, false);
}

describe('[TC-008] CMS-56227: HMAC Auth — Live Graph', () => {
  test('HMAC sees restricted content that single key cannot — proving HMAC signature is used', async () => {
    const restrictedQuery = `{
      _Content(where: { _metadata: { displayName: { eq: "${RESTRICTED_PAGES.userOnly}" } } }) {
        items { _metadata { displayName } }
      }
    }`;

    const anonClient = new GraphClient(SINGLE_KEY, { graphUrl: GRAPH_URL });
    const anonResult = await graphRequest(anonClient, restrictedQuery);
    expect(anonResult._Content.items.length).toBe(0);

    const hmacClient = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: { type: 'hmac' },
      secrets: SECRETS,
    });
    const hmacResult = await graphRequest(hmacClient, restrictedQuery);
    expect(hmacResult._Content.items.length).toBeGreaterThanOrEqual(1);
    expect(hmacResult._Content.items[0]._metadata.displayName).toBe(RESTRICTED_PAGES.userOnly);
  });
});

// ─── Group 4: Draft visibility with real draft page "one draft version" ──────

const DRAFT_SEARCH_QUERY = `{
  _Content(
    where: { _metadata: { status: { eq: "Draft" } } }
    limit: 10
  ) {
    items { _metadata { displayName status } }
  }
}`;

describe('[TC-009] CMS-56227: Draft Visibility — HMAC vs Single Key', () => {
  test('single key CANNOT see draft page', async () => {
    const client = new GraphClient(SINGLE_KEY, { graphUrl: GRAPH_URL });
    const result = await graphRequest(client, DRAFT_SEARCH_QUERY);

    const drafts = result._Content.items.filter(
      (i: any) => i._metadata.status === 'Draft',
    );
    expect(drafts.length).toBe(0);
  });

  test('HMAC + publishedOnly=false CAN see draft page', async () => {
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: { type: 'hmac' },
      secrets: SECRETS,
      query: { publishedOnly: false },
    });
    const result = await graphRequest(client, DRAFT_SEARCH_QUERY);

    const drafts = result._Content.items.filter(
      (i: any) => i._metadata.status === 'Draft',
    );
    expect(drafts.length).toBeGreaterThanOrEqual(1);

    const draftPage = drafts.find(
      (i: any) => i._metadata.displayName === DRAFT_DISPLAY_NAME,
    );
    expect(
      draftPage,
      `Draft page "${DRAFT_DISPLAY_NAME}" should be visible with HMAC + publishedOnly=false`,
    ).toBeTruthy();
    expect(draftPage._metadata.status).toBe('Draft');
  });

  test('HMAC + publishedOnly=true (default) raw query still shows draft — proving publishedOnly is NOT a raw-query feature', async () => {
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: { type: 'hmac' },
      secrets: SECRETS,
    });

    const result = await graphRequest(client, DRAFT_SEARCH_QUERY);
    const drafts = result._Content.items.filter(
      (i: any) => i._metadata.status === 'Draft',
    );
    expect(
      drafts.length,
      'publishedOnly only applies to SDK-generated queries (getContentByPath etc.), ' +
        'not to raw client.request() — so drafts are visible here even with publishedOnly=true',
    ).toBeGreaterThanOrEqual(1);
  });
});

// ─── Group 5: Preview token takes precedence over auth ──────────────────────

describe('[TC-010] CMS-56227: Preview Token Precedence', () => {
  test('preview token overrides HMAC — fake token gets 401 instead of HMAC success', async () => {
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: { type: 'hmac' },
      secrets: SECRETS,
    });

    // HMAC request works
    const hmacResult = await graphRequest(client, QUERY);
    expect(hmacResult._Content.items.length).toBeGreaterThan(0);

    // Same client, but with preview token → SDK sends Bearer <preview> instead of HMAC.
    // Fake token → Graph returns 401. If HMAC were still used, it would succeed.
    await expect(
      client.request(QUERY, {}, 'fake-preview-token-56227', false, undefined, false),
    ).rejects.toThrow(/401/);
  });

  test('preview token overrides custom resolver — resolver is NOT called', async () => {
    let resolverCalled = false;
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: () => {
        resolverCalled = true;
        return { Authorization: `epi-single ${SINGLE_KEY}` };
      },
    });

    // With preview token, resolver should be skipped entirely
    resolverCalled = false;
    try {
      await client.request(QUERY, {}, 'fake-preview-token-56227', false, undefined, false);
    } catch {
      // 401 expected from fake token
    }
    expect(resolverCalled).toBe(false);
  });

  test('HMAC still works after a preview request (no state corruption)', async () => {
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: { type: 'hmac' },
      secrets: SECRETS,
    });

    // Preview request (will fail with 401)
    try {
      await client.request(QUERY, {}, 'fake-preview-token-56227', false, undefined, false);
    } catch { /* expected */ }

    // HMAC must still work on the same client
    const result = await graphRequest(client, QUERY);
    expect(result._Content.items.length).toBeGreaterThan(0);
  });
});

// ─── Group 6: Access Rights — restricted content visibility ─────────────────
//
// Fixture: two pages with restricted read access (created manually in CMS):
//   - "only_user_auto1_has_read_right"    → only user cms.auto1+admin can read
//   - "only_content_admin_has_read_right"  → only role Content Admins can read
// Both have "Everyone" read access REMOVED.

function restrictedPagesQuery(userPage: string, rolePage: string): string {
  return `{
    userPage: _Content(where: { _metadata: { displayName: { eq: "${userPage}" } } }) {
      items { _metadata { displayName status } }
    }
    rolePage: _Content(where: { _metadata: { displayName: { eq: "${rolePage}" } } }) {
      items { _metadata { displayName status } }
    }
  }`;
}

describe('[TC-011] CMS-56227: Access Rights — restricted content visibility', () => {
  const query = restrictedPagesQuery(RESTRICTED_PAGES.userOnly, RESTRICTED_PAGES.roleOnly);

  test('single key CANNOT see either restricted page', async () => {
    const client = new GraphClient(SINGLE_KEY, { graphUrl: GRAPH_URL });
    const result = await graphRequest(client, query);

    expect(result.userPage.items.length).toBe(0);
    expect(result.rolePage.items.length).toBe(0);
  });

  test('HMAC full access (no asUser) CAN see both restricted pages', async () => {
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: { type: 'hmac' },
      secrets: SECRETS,
    });
    const result = await graphRequest(client, query);

    expect(result.userPage.items.length).toBeGreaterThanOrEqual(1);
    expect(result.rolePage.items.length).toBeGreaterThanOrEqual(1);
  });

  test('HMAC asUser=auto1 sees only the user-restricted page', async () => {
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: {
        type: 'hmac',
        asUser: { username: 'cms.auto1+admin@optimizely.com' },
      },
      secrets: SECRETS,
    });
    const result = await graphRequest(client, query);

    expect(result.userPage.items.length).toBeGreaterThanOrEqual(1);
    expect(result.userPage.items[0]._metadata.displayName).toBe(RESTRICTED_PAGES.userOnly);
    expect(result.rolePage.items.length).toBe(0);
  });

  test('HMAC asUser roles=[Content Admins] sees only the role-restricted page', async () => {
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: {
        type: 'hmac',
        asUser: { roles: ['Content Admins'] },
      },
      secrets: SECRETS,
    });
    const result = await graphRequest(client, query);

    expect(result.userPage.items.length).toBe(0);
    expect(result.rolePage.items.length).toBeGreaterThanOrEqual(1);
    expect(result.rolePage.items[0]._metadata.displayName).toBe(RESTRICTED_PAGES.roleOnly);
  });

  test('HMAC asUser=nobody with Everyone role CANNOT see either page', async () => {
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: {
        type: 'hmac',
        asUser: { username: 'nobody@test.com', roles: ['Everyone'] },
      },
      secrets: SECRETS,
    });
    const result = await graphRequest(client, query);

    expect(result.userPage.items.length).toBe(0);
    expect(result.rolePage.items.length).toBe(0);
  });
});

// Bearer auth requires a real JWT token that Graph accepts (preview token from
// CMS Edit UI, or user JWT from OptiID). Neither can be obtained programmatically
// in this test environment. Set CMS56227_BEARER_TOKEN env var to run these tests.
//
// How to get a bearer token:
//   1. Open CMS Edit UI → Visual Builder → open any page in preview
//   2. In browser DevTools Network tab, find a request to cg.optimizely.com
//   3. Copy the Authorization: Bearer <token> value
//   4. Run: CMS56227_BEARER_TOKEN=<token> pnpm test:sdk -- cms-56227

const BEARER_TOKEN = process.env.CMS56227_BEARER_TOKEN;

describe.skipIf(!BEARER_TOKEN)('[TC-013] CMS-56227: Bearer Auth — Live Graph', () => {
  test('bearer with real JWT token returns content from Graph', async () => {
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: { type: 'bearer', token: BEARER_TOKEN! },
    });

    const result = await graphRequest(client, QUERY);

    expect(result._Content).toBeTruthy();
    expect(result._Content.items.length).toBeGreaterThan(0);
    expect(result._Content.items[0]._metadata.key).toBeTruthy();
  });

  test('bearer with callback token is invoked per request', async () => {
    let callCount = 0;
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: {
        type: 'bearer',
        token: () => {
          callCount++;
          return BEARER_TOKEN!;
        },
      },
    });

    await graphRequest(client, QUERY);
    await graphRequest(client, QUERY);

    expect(callCount).toBe(2);
  });

  test('bearer can see restricted content that single key cannot', async () => {
    const restrictedQuery = `{
      _Content(where: { _metadata: { displayName: { eq: "${RESTRICTED_PAGES.userOnly}" } } }) {
        items { _metadata { displayName } }
      }
    }`;

    const anonClient = new GraphClient(SINGLE_KEY, { graphUrl: GRAPH_URL });
    const anonResult = await graphRequest(anonClient, restrictedQuery);
    expect(anonResult._Content.items.length).toBe(0);

    const bearerClient = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: { type: 'bearer', token: BEARER_TOKEN! },
    });
    const bearerResult = await graphRequest(bearerClient, restrictedQuery);
    expect(bearerResult._Content.items.length).toBeGreaterThanOrEqual(1);
    expect(bearerResult._Content.items[0]._metadata.displayName).toBe(RESTRICTED_PAGES.userOnly);
  });
});

// ─── Group 8: Custom resolver function — proving hook headers reach Graph ────

describe('[TC-012] CMS-56227: Custom Resolver — hook headers are sent to Graph', () => {
  test('resolver returning valid header succeeds even with invalid constructor key — proving hook overrides default auth', async () => {
    // Constructor key is invalid, but resolver provides the real key
    // If SDK used constructor key, this would fail. It passes → hook is used.
    const goodClient = new GraphClient('invalid-key-not-used', {
      graphUrl: GRAPH_URL,
      auth: () => ({ Authorization: `epi-single ${SINGLE_KEY}` }),
    });
    const result = await graphRequest(goodClient, QUERY);
    expect(result._Content.items.length).toBeGreaterThan(0);

    // Bad resolver: returns garbage header — Graph rejects with 401
    const badClient = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: () => ({ Authorization: 'epi-single INVALID_KEY_12345' }),
    });
    await expect(graphRequest(badClient, QUERY)).rejects.toThrow(/401/);
  });

  test('resolver is called per-request (callCount proof)', async () => {
    let callCount = 0;
    const client = new GraphClient(SINGLE_KEY, {
      graphUrl: GRAPH_URL,
      auth: () => {
        callCount++;
        return { Authorization: `epi-single ${SINGLE_KEY}` };
      },
    });

    await graphRequest(client, QUERY);
    await graphRequest(client, QUERY);
    expect(callCount).toBe(2);
  });
});

describe('[TC-014] CMS-56227: Mixed Mode — per-request auth switching', () => {
  test('HMAC sees restricted content, then anonymous on same config does not — proving per-request isolation', async () => {
    config({
      apiKey: SINGLE_KEY,
      graphUrl: GRAPH_URL,
      secrets: SECRETS,
    });

    const restrictedQuery = `{
      _Content(where: { _metadata: { displayName: { eq: "${RESTRICTED_PAGES.userOnly}" } } }) {
        items { _metadata { displayName } }
      }
    }`;

    const hmacClient = getClient({ auth: { type: 'hmac' } });
    const hmacResult = await graphRequest(hmacClient, restrictedQuery);
    expect(hmacResult._Content.items.length).toBeGreaterThanOrEqual(1);

    const anonClient = getClient();
    const anonResult = await graphRequest(anonClient, restrictedQuery);
    expect(anonResult._Content.items.length).toBe(0);
  });

  test('HMAC client does not leak auth into subsequent anonymous clients', async () => {
    config({
      apiKey: SINGLE_KEY,
      graphUrl: GRAPH_URL,
      secrets: SECRETS,
    });

    const hmacClient = getClient({ auth: { type: 'hmac' } });
    const anonClient = getClient();

    expect(hmacClient.queryDefaults.cache).toBe(false);
    expect(hmacClient.queryDefaults.stored).toBe(false);
    expect(anonClient.queryDefaults.cache).toBe(true);
    expect(anonClient.queryDefaults.stored).toBe(true);
  });
});
