import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

/**
 * CMS-56217: Support CMS Taxonomy categories in @optimizely/cms-sdk
 *
 * This content type is used to verify that the SDK includes `_metadata.categories`
 * in query responses and supports optional hierarchy resolution via `resolveCategories: true`.
 */

export const CMS56217TaxonomyPage = contentType({
  key: 'CMS56217TaxonomyPage',
  displayName: 'CMS56217 Taxonomy Page',
  baseType: '_page',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
      isRequired: true,
    },
    description: {
      type: 'string',
      displayName: 'Description',
    },
  },
});

type CMS56217TaxonomyPageProps = {
  content: ContentProps<typeof CMS56217TaxonomyPage>;
};

export default function CMS56217TaxonomyPageComponent({ content }: CMS56217TaxonomyPageProps) {
  const { pa } = getPreviewUtils(content);

  console.log("QA: CMS56217TaxonomyPage content");
  console.log(content);

  // Extract categories - these are system fields added by the SDK feature
  const categories = content._metadata?.categories;
  // resolvedCategories is now a public, typed field on _metadata
  // (TaxonomyTerm[] | undefined, see infer.ts) — no cast needed.
  const resolvedCategories = content._metadata?.resolvedCategories;

    console.log("Resolved categories");
    console.log(resolvedCategories);
    console.log(JSON.stringify(resolvedCategories));
    console.log("Raw categories");
    console.log(categories);

  // Shared cell styles — declared once so every row stays visually consistent.
  const thStyle = { textAlign: 'left', padding: '0.6rem 0.75rem', borderBottom: '2px solid #ccc', background: '#f5f5f5', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: '#555' } as const;
  const tdName = { padding: '0.6rem 0.75rem', borderBottom: '1px solid #eee', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top', color: '#1a1a1a' } as const;
  const tdValue = { padding: '0.6rem 0.75rem', borderBottom: '1px solid #eee', verticalAlign: 'top', fontSize: '0.9rem', color: '#333' } as const;
  const tdExpected = { padding: '0.6rem 0.75rem', borderBottom: '1px solid #eee', verticalAlign: 'top', fontSize: '0.85rem', color: '#555' } as const;
  const muted = { color: '#8a8a8a', fontStyle: 'italic' } as const;
  const mono = { fontFamily: 'monospace', fontSize: '0.85rem', color: '#333' } as const;

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Visual type indicator */}
      <div style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        color: '#888',
        marginBottom: '0.5rem',
      }}>
        {content.__typename ?? 'CMS56217TaxonomyPage'}
      </div>

      <h1 style={{ marginBottom: '1.5rem' }}>
        {content.title ?? 'CMS56217 Taxonomy Test Page'}
      </h1>

      {/* Property / Value / Expected overview — each content property is one row.
          Force a light card (white background + dark text) so it stays readable
          regardless of the surrounding page theme (the sample shell is dark). */}
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', background: '#ffffff', color: '#1a1a1a' }}>
        <thead>
          <tr>
            <th style={thStyle}>Property</th>
            <th style={thStyle}>Value</th>
            <th style={thStyle}>Expected</th>
          </tr>
        </thead>
        <tbody>
          {/* title */}
          <tr data-property="title">
            <td style={tdName}>content.title</td>
            <td style={tdValue} {...pa('title')}>
              {content.title ?? <span style={muted}>—</span>}
            </td>
            <td style={tdExpected}>Required non-empty string</td>
          </tr>

          {/* description */}
          <tr data-property="description">
            <td style={tdName}>content.description</td>
            <td style={tdValue} {...pa('description')}>
              {content.description ?? <span style={muted}>—</span>}
            </td>
            <td style={tdExpected}>Optional string</td>
          </tr>

          {/* _metadata.categories (raw URIs) */}
          <tr data-property="_metadata.categories">
            <td style={tdName}>content._metadata.categories</td>
            <td style={tdValue}>
              {categories && categories.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                  {categories.map((uri, index) => (
                    <li key={index} style={mono}>{uri}</li>
                  ))}
                </ul>
              ) : (
                <span style={muted}>No categories assigned</span>
              )}
            </td>
            <td style={tdExpected}>Array of category URIs (empty [] when none)</td>
          </tr>

          {/* _metadata.resolvedCategories (resolved hierarchy) — rendered in full,
              nothing summarized: every category shows key + displayName + the
              complete path (each node's key & displayName), plus a raw JSON dump. */}
          <tr data-property="_metadata.resolvedCategories">
            <td style={tdName}>content._metadata.resolvedCategories</td>
            <td style={tdValue}>
              {resolvedCategories ? (
                resolvedCategories.length > 0 ? (
                  <>
                    <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {resolvedCategories.map((category, index) => (
                        <li key={index}>
                          <div style={{ fontWeight: 'bold' }}>{category.displayName ?? '<unnamed>'}</div>
                          <div style={{ ...mono, fontSize: '0.75rem', color: '#777' }}>Key: {category.key}</div>
                          <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.35rem' }}>
                            Path ({category.path?.length ?? 0}):
                          </div>
                          {category.path && category.path.length > 0 ? (
                            <ol style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem' }}>
                              {category.path.map((node, i) => (
                                <li key={i} style={{ fontSize: '0.8rem', color: '#333', marginBottom: '0.15rem' }}>
                                  <span>{node.displayName ?? '<unnamed>'}</span>{' '}
                                  <span style={{ ...mono, fontSize: '0.72rem', color: '#999' }}>({node.key})</span>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <span style={muted}>empty path</span>
                          )}
                        </li>
                      ))}
                    </ol>
                    <details style={{ marginTop: '0.85rem' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#777' }}>Raw JSON</summary>
                      <pre style={{ ...mono, fontSize: '0.72rem', color: '#333', background: '#f7f7f7', padding: '0.5rem', borderRadius: '4px', margin: '0.35rem 0 0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(resolvedCategories, null, 2)}
                      </pre>
                    </details>
                  </>
                ) : (
                  <span style={muted}>No resolved categories</span>
                )
              ) : (
                <span style={muted}>Not resolved (resolveTaxonomy not requested)</span>
              )}
            </td>
            <td style={tdExpected}>Hierarchy array (key, displayName, path) when resolveTaxonomy: true</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
