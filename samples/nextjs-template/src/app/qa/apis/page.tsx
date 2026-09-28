'use client';

import React, { useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type EndpointId = 'getContent' | 'getContentByPath' | 'getPreviewContent' | 'getPath' | 'getItems' | 'getLocales';

type ResultState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: unknown;
  error?: string;
  durationMs?: number;
  queryLogs?: string[];
  requestInfo?: {
    endpoint: string;
    params: Record<string, string>;
    storedEnabled: boolean;
    graphUrl?: string;
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clean(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v.trim() !== ''));
}

// ─── Endpoint Configs ────────────────────────────────────────────────────────

const ENDPOINTS: {
  id: EndpointId;
  label: string;
  description: string;
  fields: { name: string; label: string; placeholder: string; required?: boolean }[];
}[] = [
  {
    id: 'getContent',
    label: 'getContent()',
    description: 'Fetch a single content item by key. Uses GetContent query with scalar $key, $version, $metadataLocale.',
    fields: [
      { name: 'key', label: 'Content Key', placeholder: 'e.g. 880777d5a2824399b07e93e3ca70668e', required: true },
      { name: 'locale', label: 'Locale', placeholder: 'e.g. en' },
      { name: 'version', label: 'Version', placeholder: 'e.g. 123 (draft)' },
      { name: 'stored', label: 'stored', placeholder: 'true / false (default: true)' },
    ],
  },
  {
    id: 'getContentByPath',
    label: 'getContentByPath()',
    description: 'Fetch content item(s) by URL path. Uses GetContentByPath query with scalar $path, $pathNoSlash, $host. Note: locale is not supported — path already encodes locale (e.g. /en/home/). Use the same host the content was indexed with (e.g. https://localhost:3001 for local dev).',
    fields: [
      { name: 'path', label: 'URL Path', placeholder: 'e.g. /en/home/', required: true },
      { name: 'host', label: 'Host (must match what content was indexed with)', placeholder: 'e.g. https://localhost:3001' },
      { name: 'stored', label: 'stored', placeholder: 'true / false (default: true)' },
    ],
  },
  {
    id: 'getPreviewContent',
    label: 'getPreviewContent()',
    description: 'Fetch preview content. Uses GetContent with variation: { include: ALL }. Requires preview token.',
    fields: [
      { name: 'key', label: 'Content Key', placeholder: 'e.g. 880777d5a2824399b07e93e3ca70668e', required: true },
      { name: 'ver', label: 'Version', placeholder: 'e.g. 5 (draft version)', required: true },
      { name: 'loc', label: 'Locale', placeholder: 'e.g. en', required: true },
      { name: 'preview_token', label: 'Preview Token', placeholder: 'Bearer token from CMS', required: true },
      { name: 'stored', label: 'stored', placeholder: 'true / false (default: true)' },
    ],
  },
  {
    id: 'getPath',
    label: 'getPath()',
    description: 'Get breadcrumb path hierarchy for a content item. Uses scalar $key or $path with $locale: [Locales]. Leave locale blank to match any locale.',
    fields: [
      { name: 'key', label: 'Content Key (or path below)', placeholder: 'e.g. 880777d5a2824399b07e93e3ca70668e' },
      { name: 'path', label: 'URL Path (or key above)', placeholder: 'e.g. /en/home/' },
      { name: 'locale', label: 'Locale(s)', placeholder: 'e.g. en  or  en,sv' },
      { name: 'host', label: 'Host', placeholder: 'e.g. https://localhost:3000' },
      { name: 'stored', label: 'stored', placeholder: 'true / false (default: true)' },
    ],
  },
  {
    id: 'getLocales',
    label: 'Locales enum',
    description: 'Introspect the Locales enum to see all locale codes configured in this Graph instance.',
    fields: [],
  },
  {
    id: 'getItems',
    label: 'getItems()',
    description: 'Get child items linked from a content item. Uses scalar $key or $path with $locale: [Locales]. Leave locale blank to match any locale.',
    fields: [
      { name: 'key', label: 'Content Key (or path below)', placeholder: 'e.g. 880777d5a2824399b07e93e3ca70668e' },
      { name: 'path', label: 'URL Path (or key above)', placeholder: 'e.g. /en/home/' },
      { name: 'locale', label: 'Locale(s)', placeholder: 'e.g. en  or  en,sv' },
      { name: 'host', label: 'Host', placeholder: 'e.g. https://localhost:3000' },
      { name: 'stored', label: 'stored', placeholder: 'true / false (default: true)' },
    ],
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QaApisPage() {
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointId>('getContent');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Partial<Record<EndpointId, ResultState>>>({});

  const endpoint = ENDPOINTS.find(e => e.id === activeEndpoint)!;
  const result = results[activeEndpoint] ?? { status: 'idle' };

  function handleInput(name: string, value: string) {
    setInputs(prev => ({ ...prev, [name]: value }));
  }

  function switchEndpoint(id: EndpointId) {
    setActiveEndpoint(id);
    setInputs({});
  }

  async function runTest() {
    const params = clean(inputs);
    const storedEnabled = inputs.stored !== 'false';

    setResults(prev => ({
      ...prev,
      [activeEndpoint]: { status: 'loading', requestInfo: { endpoint: activeEndpoint, params, storedEnabled } },
    }));

    const start = performance.now();
    try {
      const body = JSON.stringify({ endpoint: activeEndpoint, params, stored: storedEnabled });
      const res = await fetch('/qa/apis/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const json = await res.json();
      const durationMs = Math.round(performance.now() - start);

      const queryLogs: string[] = json.queryLogs ?? [];
      const graphUrl: string | undefined = json.graphUrl;
      if (!res.ok) {
        setResults(prev => ({
          ...prev,
          [activeEndpoint]: { status: 'error', error: json.error ?? JSON.stringify(json), durationMs, queryLogs, requestInfo: { endpoint: activeEndpoint, params, storedEnabled, graphUrl } },
        }));
      } else {
        setResults(prev => ({
          ...prev,
          [activeEndpoint]: { status: 'success', data: json.data ?? json, durationMs, queryLogs, requestInfo: { endpoint: activeEndpoint, params, storedEnabled, graphUrl } },
        }));
      }
    } catch (e: any) {
      setResults(prev => ({
        ...prev,
        [activeEndpoint]: { status: 'error', error: e.message, durationMs: Math.round(performance.now() - start), requestInfo: { endpoint: activeEndpoint, params, storedEnabled } },
      }));
    }
  }

  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>CMS-55090 — Graph SDK API Tester</h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 24 }}>
        Test tất cả public GraphClient endpoints. Verify scalar variables, stored queries, và response correctness.
      </p>

      {/* Endpoint tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {ENDPOINTS.map(ep => (
          <button
            key={ep.id}
            onClick={() => switchEndpoint(ep.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid',
              borderColor: activeEndpoint === ep.id ? '#0070f3' : '#ddd',
              background: activeEndpoint === ep.id ? '#0070f3' : '#fff',
              color: activeEndpoint === ep.id ? '#fff' : '#333',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeEndpoint === ep.id ? 600 : 400,
            }}
          >
            {ep.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Input panel */}
        <div style={{ background: '#f8f9fa', border: '1px solid #e1e4e8', borderRadius: 8, padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{endpoint.label}</h2>
          <p style={{ fontSize: 12, color: '#555', marginBottom: 16, lineHeight: 1.5 }}>{endpoint.description}</p>

          {endpoint.fields.map(field => (
            <div key={field.name} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#333' }}>
                {field.label}
                {field.required && <span style={{ color: '#e00', marginLeft: 4 }}>*</span>}
              </label>
              <input
                type="text"
                value={inputs[field.name] ?? ''}
                onChange={e => handleInput(field.name, e.target.value)}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  border: '1px solid #ccc',
                  borderRadius: 5,
                  fontSize: 12,
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          ))}

          <button
            onClick={runTest}
            disabled={result.status === 'loading'}
            style={{
              width: '100%',
              padding: '9px 0',
              background: result.status === 'loading' ? '#999' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: result.status === 'loading' ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {result.status === 'loading' ? 'Running…' : '▶ Run'}
          </button>
        </div>

        {/* Result panel */}
        <div>
          {/* Request info */}
          {result.requestInfo && (
            <div style={{ background: '#1e1e1e', color: '#9cdcfe', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 12 }}>
              <div style={{ color: '#888', marginBottom: 8 }}>REQUEST</div>
              <div><span style={{ color: '#dcdcaa' }}>endpoint:</span> <span style={{ color: '#ce9178' }}>{result.requestInfo.endpoint}</span></div>
              <div><span style={{ color: '#dcdcaa' }}>stored:</span> <span style={{ color: result.requestInfo.storedEnabled ? '#4ec9b0' : '#f44747' }}>{String(result.requestInfo.storedEnabled)}</span></div>
              {result.requestInfo.graphUrl && (
                <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #333' }}>
                  <span style={{ color: '#dcdcaa' }}>URL: </span>
                  <span style={{ color: '#4ec9b0', wordBreak: 'break-all' }}>{result.requestInfo.graphUrl}</span>
                </div>
              )}
              {Object.entries(result.requestInfo.params).filter(([k]) => k !== 'stored').map(([k, v]) => (
                <div key={k}><span style={{ color: '#dcdcaa' }}>{k}:</span> <span style={{ color: '#ce9178' }}>&quot;{v}&quot;</span></div>
              ))}
            </div>
          )}

          {/* Status badge */}
          {result.status !== 'idle' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                background: result.status === 'success' ? '#d4edda' : result.status === 'error' ? '#f8d7da' : '#fff3cd',
                color: result.status === 'success' ? '#155724' : result.status === 'error' ? '#721c24' : '#856404',
              }}>
                {result.status === 'success' ? '✅ PASS' : result.status === 'error' ? '❌ FAIL' : '⏳ Loading'}
              </span>
              {result.durationMs !== undefined && (
                <span style={{ fontSize: 12, color: '#666' }}>{result.durationMs}ms</span>
              )}
            </div>
          )}

          {/* Response */}
          {result.status === 'error' && (
            <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', marginBottom: 8 }}>Error</div>
              <pre style={{ fontSize: 12, color: '#7f1d1d', whiteSpace: 'pre-wrap', margin: 0 }}>{result.error}</pre>
            </div>
          )}

          {result.status === 'success' && result.data !== undefined && (
            <div>
              {/* Summary */}
              <SummaryRow data={result.data} />

              {/* Raw JSON */}
              <details open style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#555', marginBottom: 8 }}>
                  Raw Response
                </summary>
                <pre style={{
                  background: '#1e1e1e', color: '#d4d4d4', borderRadius: 8,
                  padding: 16, fontSize: 11, overflow: 'auto', maxHeight: 480,
                  whiteSpace: 'pre-wrap', margin: 0,
                }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Query logs */}
          {result.queryLogs && result.queryLogs.length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#555', marginBottom: 8 }}>
                GraphQL Queries ({result.queryLogs.length})
              </summary>
              {result.queryLogs.map((log, i) => (
                <pre key={i} style={{
                  background: '#0d1117', color: '#e6edf3', borderRadius: 8,
                  padding: 14, fontSize: 11, overflow: 'auto', maxHeight: 360,
                  whiteSpace: 'pre-wrap', margin: '8px 0',
                }}>
                  {log}
                </pre>
              ))}
            </details>
          )}

          {result.status === 'idle' && (
            <div style={{ color: '#888', fontSize: 13, padding: 24, textAlign: 'center', border: '1px dashed #ddd', borderRadius: 8 }}>
              Fill in the fields and press Run to test the endpoint.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ data }: { data: unknown }) {
  if (data === null) {
    return <div style={{ fontSize: 13, color: '#666', padding: '8px 0' }}>Response: <strong>null</strong> (content not found)</div>;
  }
  if (Array.isArray(data)) {
    return <div style={{ fontSize: 13, color: '#155724', padding: '8px 0' }}>Response: <strong>{data.length} item(s)</strong></div>;
  }
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const type = (obj._metadata as any)?.types?.[0] ?? (obj.__typename as string) ?? 'object';
    return (
      <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 6, padding: '10px 14px', fontSize: 12 }}>
        <span style={{ fontWeight: 700 }}>Content type: </span>{type}
        {(obj._metadata as any)?.key && <span style={{ marginLeft: 16 }}><span style={{ fontWeight: 700 }}>Key: </span>{(obj._metadata as any).key}</span>}
        {(obj._metadata as any)?.locale && <span style={{ marginLeft: 16 }}><span style={{ fontWeight: 700 }}>Locale: </span>{(obj._metadata as any).locale}</span>}
      </div>
    );
  }
  return null;
}
