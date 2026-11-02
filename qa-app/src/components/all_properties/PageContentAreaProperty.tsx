import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const PageContentAreaProperty = contentType({
  key: 'PageContentAreaProperty',
  displayName: 'Page ContentArea Property',
  baseType: '_page',
  properties: {
    simpleContentArea: {
      type: 'array',
      items: { type: 'content', allowedTypes: ['_page'] },
    },
    contentAreaWithAllowed: {
      type: 'array',
      displayName: 'ContentArea with AllowedTypes',
      description: 'A contentArea with allowedTypes constraint',
      isRequired: false,
      isLocalized: false,
      group: 'Content',
      sortOrder: 115,
      displayMode: 'available',
      items: { type: 'content', allowedTypes: ['_page', '_component'] },
      maxItems: 20,
    },
    contentAreaWithRestricted: {
      type: 'array',
      displayName: 'ContentArea with RestrictedTypes',
      items: { type: 'content', restrictedTypes: ['_folder', '_media'] },
    },
    hiddenContentArea: {
      type: 'array',
      displayMode: 'hidden',
      items: { type: 'content', allowedTypes: ['_page'] },
    },
  },
});

type Props = { content: ContentProps<typeof PageContentAreaProperty> };

export default function PageContentAreaPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8f4e8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'PageContentAreaProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleContentArea"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleContentArea</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleContentArea')}>{JSON.stringify(content.simpleContentArea) ?? '—'}</td></tr>
          <tr data-property="contentAreaWithAllowed"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>contentAreaWithAllowed</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('contentAreaWithAllowed')}>{JSON.stringify(content.contentAreaWithAllowed) ?? '—'}</td></tr>
          <tr data-property="contentAreaWithRestricted"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>contentAreaWithRestricted</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('contentAreaWithRestricted')}>{JSON.stringify(content.contentAreaWithRestricted) ?? '—'}</td></tr>
          <tr data-property="hiddenContentArea"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenContentArea</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenContentArea) ?? '—'}</td></tr>
        </tbody>
      </table>
    </main>
  );
}
