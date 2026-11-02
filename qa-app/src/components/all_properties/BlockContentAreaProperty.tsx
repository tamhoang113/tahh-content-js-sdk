import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockContentAreaProperty = contentType({
  key: 'BlockContentAreaProperty',
  displayName: 'Block ContentArea Property',
  baseType: '_component',
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

type Props = { content: ContentProps<typeof BlockContentAreaProperty> };

export default function BlockContentAreaPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockContentAreaProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleContentArea"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleContentArea</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleContentArea')}>{JSON.stringify(content.simpleContentArea) ?? '—'}</td></tr>
          <tr data-property="contentAreaWithAllowed"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>contentAreaWithAllowed</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('contentAreaWithAllowed')}>{JSON.stringify(content.contentAreaWithAllowed) ?? '—'}</td></tr>
          <tr data-property="contentAreaWithRestricted"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>contentAreaWithRestricted</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify(content.contentAreaWithRestricted) ?? '—'}</td></tr>
          <tr data-property="hiddenContentArea"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenContentArea</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenContentArea) ?? '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
