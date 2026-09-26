import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { AsyncLocalStorage } from 'async_hooks';
import { GraphClient } from '@optimizely/cms-sdk';
import { configureAdapter } from '@optimizely/cms-sdk/react/server';
import type { ContextAdapter, ContextData } from '@optimizely/cms-sdk/react/server';
import { ensureContentTypesRegistered } from '@/qa/_api-registry';

// Route Handlers don't have React.cache() — use AsyncLocalStorage instead
const storage = new AsyncLocalStorage<Partial<ContextData>>();
const routeAdapter: ContextAdapter = {
  initializeContext() { storage.enterWith({}); },
  getData() { return storage.getStore() as ContextData | undefined; },
  setData(value) { Object.assign(storage.getStore() ?? {}, value); },
  set(key, value) { const s = storage.getStore(); if (s) s[key] = value as any; },
  get(key) { return storage.getStore()?.[key]; },
};
configureAdapter(routeAdapter);

ensureContentTypesRegistered();

const GRAPH_KEY = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY ?? 'HPcUTakgQaL1MYbGDQzLbastFxgNPM4Sx3kggMsqAAbhICsV';
const GRAPH_URL = process.env.OPTIMIZELY_GRAPH_GATEWAY ?? 'https://staging.cg.optimizely.com/content/v2';
const LOGS_DIR = path.join(process.cwd(), 'logs');

function getClient(apiKey?: string) {
  return new GraphClient(apiKey ?? GRAPH_KEY, { graphUrl: GRAPH_URL });
}

function getLogFilesBefore(): Set<string> {
  try {
    return new Set(fs.existsSync(LOGS_DIR) ? fs.readdirSync(LOGS_DIR) : []);
  } catch { return new Set(); }
}

function getNewLogs(before: Set<string>): string[] {
  try {
    if (!fs.existsSync(LOGS_DIR)) return [];
    return fs.readdirSync(LOGS_DIR)
      .filter(f => !before.has(f) && f.startsWith('graphql-queries-'))
      .sort()
      .map(f => {
        try { return fs.readFileSync(path.join(LOGS_DIR, f), 'utf-8'); } catch { return ''; }
      })
      .filter(Boolean);
  } catch { return []; }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }

  const { endpoint, params, stored = true } = body as {
    endpoint: string;
    params: Record<string, string>;
    stored: boolean;
  };

  const client = getClient(params.apiKey);
  const queryOpts = { stored, cache: false };
  const host = params.host || undefined;

  const logsBefore = getLogFilesBefore();

  try {
    let result: unknown;

    switch (endpoint) {
      case 'getContent': {
        if (!params.key) return NextResponse.json({ error: 'key is required' }, { status: 400 });
        result = await client.getContent(
          { key: params.key, locale: params.locale || undefined, version: params.version || undefined },
          queryOpts,
        );
        break;
      }

      case 'getContentByPath': {
        if (!params.path) return NextResponse.json({ error: 'path is required' }, { status: 400 });
        result = await client.getContentByPath(params.path, { ...queryOpts, host });
        break;
      }

      case 'getPreviewContent': {
        const missing = ['key', 'ver', 'loc', 'preview_token'].filter(k => !params[k]);
        if (missing.length) {
          return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
        }
        result = await client.getPreviewContent(
          { key: params.key, ver: params.ver, loc: params.loc, preview_token: params.preview_token, ctx: '' },
          queryOpts,
        );
        break;
      }

      case 'getPath': {
        const locales = params.locale ? params.locale.split(',').map(l => l.trim()).filter(Boolean) : undefined;
        const ref = params.key ? { key: params.key } : params.path;
        if (!ref) return NextResponse.json({ error: 'key or path is required' }, { status: 400 });
        result = await client.getPath(ref, { ...queryOpts, host, locales });
        break;
      }

      case 'getItems': {
        const locales = params.locale ? params.locale.split(',').map(l => l.trim()).filter(Boolean) : undefined;
        const ref = params.key ? { key: params.key } : params.path;
        if (!ref) return NextResponse.json({ error: 'key or path is required' }, { status: 400 });
        result = await client.getItems(ref, { ...queryOpts, host, locales });
        break;
      }

      case 'getLocales': {
        // const data: any = await client.request(
        //   `query { __type(name: "Locales") { enumValues { name } } }`,
        //   {}, undefined, false, undefined, false,
        // );
        // result = data?.__type?.enumValues?.map((v: any) => v.name) ?? [];
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 400 });
    }

    const queryLogs = getNewLogs(logsBefore);
    const graphUrl = `${GRAPH_URL}?cache=false${stored ? '&stored=true' : ''}`;
    return NextResponse.json({ data: result ?? null, queryLogs, graphUrl });
  } catch (e: any) {
    const queryLogs = getNewLogs(logsBefore);
    const message = e?.message ?? String(e);
    const graphUrl = `${GRAPH_URL}?cache=false${stored ? '&stored=true' : ''}`;
    return NextResponse.json({ error: message, queryLogs, graphUrl }, { status: 500 });
  }
}
