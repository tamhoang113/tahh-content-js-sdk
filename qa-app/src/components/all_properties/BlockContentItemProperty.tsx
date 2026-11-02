import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockContentItemProperty = contentType({
  key: 'BlockContentItemProperty',
  displayName: 'Block ContentItem Property',
  baseType: '_component',
  properties: {
    simpleContent: {
      type: 'content',
      allowedTypes: ['_page'],
    },
    fullContent: {
      type: 'content',
      displayName: 'Full ContentAreaItem',
      description: 'A content item with every field set',
      isRequired: false,
      isLocalized: false,
      group: 'Content',
      sortOrder: 130,
      displayMode: 'available',
      allowedTypes: ['_page', '_component'],
    },
    contentWithRestricted: {
      type: 'content',
      displayName: 'ContentAreaItem with RestrictedTypes',
      restrictedTypes: ['_folder', '_media'],
    },
    hiddenContent: {
      type: 'content',
      displayMode: 'hidden',
      allowedTypes: ['_page'],
    },
  },
});

type Props = { content: ContentProps<typeof BlockContentItemProperty> };

export default function BlockContentItemPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockContentItemProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleContent"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleContent</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleContent')}>{JSON.stringify(content.simpleContent) ?? '—'}</td></tr>
          <tr data-property="fullContent"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullContent</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullContent')}>{JSON.stringify(content.fullContent) ?? '—'}</td></tr>
          <tr data-property="contentWithRestricted"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>contentWithRestricted</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify(content.contentWithRestricted) ?? '—'}</td></tr>
          <tr data-property="hiddenContent"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenContent</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenContent) ?? '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
