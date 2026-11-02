import { NextRequest, NextResponse } from 'next/server';
import { AsyncLocalStorage } from 'async_hooks';
import { GraphClient, initContentTypeRegistry } from '@optimizely/cms-sdk';
import { configureAdapter } from '@optimizely/cms-sdk/react/server';
import type { ContextAdapter, ContextData } from '@optimizely/cms-sdk/react/server';
import { QA_CONTENT_TYPES } from '@/components/_registry';

const storage = new AsyncLocalStorage<Partial<ContextData>>();
const routeAdapter: ContextAdapter = {
  initializeContext() { storage.enterWith({}); },
  getData() { return storage.getStore() as ContextData | undefined; },
  setData(value) { Object.assign(storage.getStore() ?? {}, value); },
  set(key, value) { const s = storage.getStore(); if (s) s[key] = value as any; },
  get(key) { return storage.getStore()?.[key]; },
};
configureAdapter(routeAdapter);

initContentTypeRegistry(QA_CONTENT_TYPES);

const GRAPH_KEY = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY ?? '';
const GRAPH_URL = process.env.OPTIMIZELY_GRAPH_GATEWAY ?? 'https://staging.cg.optimizely.com/content/v2';

function getClient(apiKey?: string) {
  return new GraphClient(apiKey ?? GRAPH_KEY, {
    graphUrl: GRAPH_URL,
    fragment: { expandContracts: true },
  });
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

  try {
    let result: unknown;

    switch (endpoint) {
      case 'getContent': {
        if (!params.key) return NextResponse.json({ error: 'key is required' }, { status: 400 });
        result = await client.getContent(
          { key: params.key, locale: params.locale || undefined, version: params.version || undefined },
          { ...queryOpts, resolveTaxonomy: params.resolveTaxonomy === 'true' },
        );
        break;
      }

      case 'getContentByPath': {
        if (!params.path) return NextResponse.json({ error: 'path is required' }, { status: 400 });
        const resolveTaxonomy = params.resolveTaxonomy === 'true';
        const variation = params.variation ? (typeof params.variation === 'string' ? JSON.parse(params.variation) : params.variation) : undefined;
        result = await client.getContentByPath(params.path, { ...queryOpts, host, resolveTaxonomy, variation });
        break;
      }

      case 'getPreviewContent': {
        const missing = ['key', 'ver', 'loc', 'preview_token'].filter(k => !params[k]);
        if (missing.length) {
          return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
        }
        const forceMediaToken = params.forceMediaToken === 'true';
        result = await client.getPreviewContent(
          { key: params.key, ver: params.ver, loc: params.loc, preview_token: params.preview_token, ctx: '' },
          { ...queryOpts, forceMediaToken },
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

      default:
        return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 400 });
    }

    const graphUrl = `${GRAPH_URL}?cache=false${stored ? '&stored=true' : ''}`;
    return NextResponse.json({ data: result ?? null, graphUrl });
  } catch (e: any) {
    const message = e?.message ?? String(e);
    const graphUrl = `${GRAPH_URL}?cache=false${stored ? '&stored=true' : ''}`;
    return NextResponse.json({ error: message, graphUrl }, { status: 500 });
  }
}
