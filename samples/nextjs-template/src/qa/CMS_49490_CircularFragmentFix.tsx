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
    // No allowedTypes → resolves to all registered types at query build time.
    // After fix: MapPage fragment includes ...ArticlePage but NOT ...MapPage.
    Title: { type: 'string' },
    MainMap: { type: 'array', items: { type: 'content', allowedTypes: ['CMS49490ArticlePage', 'CMS49490MapPage', 'CMS49490MapBlock'] } },
  },
});

export const CMS49490ArticlePage = contentType({
  baseType: '_page',
  key: 'CMS49490ArticlePage',
  displayName: 'CMS49490 Article Page',
  properties: {
    // After fix: ArticlePage fragment does NOT include ...MapPage (ancestor)
    // and does NOT include ...ArticlePage (self).
    Title: { type: 'string' },
    BodyContent: { type: 'array', items: { type: 'content', allowedTypes: ['CMS49490ArticlePage', 'CMS49490MapPage'] } },
  },
});

export const CMS49490MapBlock = contentType({
  baseType: '_component',
  key: 'CMS49490MapBlock',
  displayName: 'CMS49490 Map Block',
  properties: {
    // No allowedTypes → resolves to all registered types at query build time.
    // After fix: MapPage fragment includes ...ArticlePage but NOT ...MapPage.
    Title: { type: 'string' },
    MainMap: { type: 'array', items: { type: 'content', allowedTypes: ['CMS49490MapBlock'] } },
  },
});

// ─── React Components ─────────────────────────────────────────────────────────

type MapPageProps = {
  content: ContentProps<typeof CMS49490MapPage>;
};

export default function CMS49490MapPageComponent({ content }: MapPageProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <div
      style={{
        border: '2px solid #1565c0',
        borderRadius: '10px',
        padding: '1.5rem',
        maxWidth: '900px',
        margin: '0 auto 1.5rem',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#1565c0',
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}
      >
        CMS49490MapPage · _page
      </div>
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          margin: '0 0 1rem',
          color: '#555',
        }}
      >
        CMS-49490: Page rendered ✓ — SDK generated non-circular GraphQL fragments.
        <br />
        <em>If this page loads without a GraphQL error, the circular-fragment bug is fixed.</em>
      </p>
      <div
        {...pa('Title')}
        style={{ borderTop: '1px solid #bbdefb', paddingTop: '1rem' }}
      >
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          Title: {content.Title ?? '(no title)'}
        </strong>
      </div>
      <div
        {...pa('MainMap')}
        style={{ borderTop: '1px solid #bbdefb', paddingTop: '1rem' }}
      >
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          MainMap ({content.MainMap?.length ?? 0} items):
        </strong>
        {content.MainMap && content.MainMap.length > 0 ? (
          content.MainMap.map((item, i) => (
            <OptimizelyComponent key={i} content={item} />
          ))
        ) : (
          <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>(no items — add content in CMS)</p>
        )}
      </div>
    </div>
  );
}

type ArticlePageProps = {
  content: ContentProps<typeof CMS49490ArticlePage>;
};

export function CMS49490ArticlePageComponent({ content }: ArticlePageProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <div
      style={{
        border: '1px solid #90caf9',
        borderRadius: '8px',
        padding: '1rem',
        margin: '0.5rem 0',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#1976d2',
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}
      >
        CMS49490ArticlePage · _page
      </div>
      <div
        {...pa('Title')}
        style={{ borderTop: '1px solid #bbdefb', paddingTop: '1rem' }}
      >
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          Title: {content.Title ?? '(no title)'}
        </strong>
      </div>
      <div {...pa('BodyContent')}>
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          BodyContent ({content.BodyContent?.length ?? 0} items):
        </strong>
        {content.BodyContent && content.BodyContent.length > 0 ? (
          content.BodyContent.map((item, i) => (
            <OptimizelyComponent key={i} content={item} />
          ))
        ) : (
          <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>(no items)</p>
        )}
      </div>
    </div>
  );
}

type MapBlockProps = {
  content: ContentProps<typeof CMS49490MapBlock>;
};

export function CMS49490MapBlockComponent({ content }: MapBlockProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <div
      style={{
        border: '1px solid #90caf9',
        borderRadius: '8px',
        padding: '1rem',
        margin: '0.5rem 0',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#1976d2',
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}
      >
        CMS49490MapBlock · _block
      </div>
      <div
        {...pa('Title')}
        style={{ borderTop: '1px solid #bbdefb', paddingTop: '1rem' }}
      >
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          Title: {content.Title ?? '(no title)'}
        </strong>
      </div>
      <div
        {...pa('MainMap')}
        style={{ borderTop: '1px solid #bbdefb', paddingTop: '1rem' }}
      >
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
          MainMap ({content.MainMap?.length ?? 0} items):
        </strong>
        {content.MainMap && content.MainMap.length > 0 ? (
          content.MainMap.map((item, i) => (
            <OptimizelyComponent key={i} content={item} />
          ))
        ) : (
          <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>(no items — add content in CMS)</p>
        )}
      </div>
    </div>
  );
}
