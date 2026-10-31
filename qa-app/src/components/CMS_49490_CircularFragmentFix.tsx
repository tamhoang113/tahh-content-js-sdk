import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

// ─── Content Types ────────────────────────────────────────────────────────────
//
// CMS-49490: Two _page types with content-array properties (no allowedTypes).
// Bug: resolveAllowedTypes() returned ALL registered types → MapPage's fragment
//      included ...ArticlePage, and ArticlePage's fragment included ...MapPage = circular.
// Fix: ancestors set in createFragment() skips spread refs for types currently
//      on the recursion stack — each type's fragment omits its own ancestors.

export const CMS49490MapPage = contentType({
  baseType: '_page',
  key: 'CMS49490MapPage',
  displayName: 'CMS49490 Map Page',
  properties: {
    Title: { type: 'string' },
    MainMap: { type: 'array', items: { type: 'content', allowedTypes: ['CMS49490ArticlePage', 'CMS49490MapPage', 'CMS49490MapBlock'] } },
  },
});

export const CMS49490ArticlePage = contentType({
  baseType: '_page',
  key: 'CMS49490ArticlePage',
  displayName: 'CMS49490 Article Page',
  properties: {
    Title: { type: 'string' },
    BodyContent: { type: 'array', items: { type: 'content', allowedTypes: ['CMS49490ArticlePage', 'CMS49490MapPage'] } },
  },
});

export const CMS49490MapBlock = contentType({
  baseType: '_component',
  key: 'CMS49490MapBlock',
  displayName: 'CMS49490 Map Block',
  properties: {
    Title: { type: 'string' },
    MainMap: { type: 'array', items: { type: 'content', allowedTypes: ['CMS49490MapBlock'] } },
  },
});

// ─── Shared table styles ─────────────────────────────────────────────────────

const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  border: '1px solid #e0e0e0',
  background: '#fff',
  color: '#1a1a1a',
  marginTop: '1rem',
};

const thStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
  backgroundColor: '#f5f5f5',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem',
  borderBottom: '1px solid #eee',
};

// ─── React Components ─────────────────────────────────────────────────────────

type MapPageProps = {
  content: ContentProps<typeof CMS49490MapPage>;
};

export default function CMS49490MapPageComponent({ content }: MapPageProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>
        {content.__typename ?? 'CMS49490MapPage'}
      </div>
      <h1 {...pa('Title')}>{content.Title ?? 'CMS49490 Map Page'}</h1>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Property</th>
            <th style={thStyle}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="Title">
            <td style={tdStyle}>content.Title</td>
            <td data-col="value" style={tdStyle} {...pa('Title')}>{content.Title ?? '—'}</td>
          </tr>
          <tr data-property="MainMap">
            <td style={tdStyle}>content.MainMap</td>
            <td data-col="value" style={tdStyle} {...pa('MainMap')}>
              {content.MainMap && content.MainMap.length > 0 ? (
                content.MainMap.map((item, i) => (
                  <OptimizelyComponent key={i} content={item} />
                ))
              ) : '—'}
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}

type ArticlePageProps = {
  content: ContentProps<typeof CMS49490ArticlePage>;
};

export function CMS49490ArticlePageComponent({ content }: ArticlePageProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>
        {content.__typename ?? 'CMS49490ArticlePage'}
      </div>
      <h1 {...pa('Title')}>{content.Title ?? 'CMS49490 Article Page'}</h1>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Property</th>
            <th style={thStyle}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="Title">
            <td style={tdStyle}>content.Title</td>
            <td data-col="value" style={tdStyle} {...pa('Title')}>{content.Title ?? '—'}</td>
          </tr>
          <tr data-property="BodyContent">
            <td style={tdStyle}>content.BodyContent</td>
            <td data-col="value" style={tdStyle} {...pa('BodyContent')}>
              {content.BodyContent && content.BodyContent.length > 0 ? (
                content.BodyContent.map((item, i) => (
                  <OptimizelyComponent key={i} content={item} />
                ))
              ) : '—'}
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}

type MapBlockProps = {
  content: ContentProps<typeof CMS49490MapBlock>;
};

export function CMS49490MapBlockComponent({ content }: MapBlockProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888' }}>
        {content.__typename ?? 'CMS49490MapBlock'}
      </div>
      <h1 {...pa('Title')}>{content.Title ?? 'CMS49490 Map Block'}</h1>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Property</th>
            <th style={thStyle}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="Title">
            <td style={tdStyle}>content.Title</td>
            <td data-col="value" style={tdStyle} {...pa('Title')}>{content.Title ?? '—'}</td>
          </tr>
          <tr data-property="MainMap">
            <td style={tdStyle}>content.MainMap</td>
            <td data-col="value" style={tdStyle} {...pa('MainMap')}>
              {content.MainMap && content.MainMap.length > 0 ? (
                content.MainMap.map((item, i) => (
                  <OptimizelyComponent key={i} content={item} />
                ))
              ) : '—'}
            </td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
