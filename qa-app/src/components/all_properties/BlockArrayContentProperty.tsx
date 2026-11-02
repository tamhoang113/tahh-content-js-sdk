import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockArrayContentProperty = contentType({
  key: 'BlockArrayContentProperty',
  displayName: 'Block Array Content Property',
  baseType: '_component',
  properties: {
    simpleArray: {
      type: 'array',
      items: { type: 'content', allowedTypes: ['_page'] },
    },
    fullArray: {
      type: 'array',
      displayName: 'Full Content Array',
      description: 'A content array with every field set',
      isRequired: false,
      isLocalized: false,
      group: 'Content',
      sortOrder: 90,
      displayMode: 'available',
      items: { type: 'content', allowedTypes: ['_page', '_component'] },
      minItems: 1,
      maxItems: 10,
    },
  },
});

type Props = { content: ContentProps<typeof BlockArrayContentProperty> };

export default function BlockArrayContentPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'BlockArrayContentProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleArray"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleArray</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleArray')}>{JSON.stringify(content.simpleArray) ?? '—'}</td></tr>
          <tr data-property="fullArray"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullArray</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullArray')}>{JSON.stringify(content.fullArray) ?? '—'}</td></tr>
        </tbody>
      </table>
    </main>
  );
}
