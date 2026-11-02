import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ExpRichTextProperty = contentType({
  key: 'ExpRichTextProperty',
  displayName: 'Exp RichText Property',
  baseType: '_experience',
  properties: {
    simpleRichText: { type: 'richText' },
    fullRichText: {
      type: 'richText',
      displayName: 'Full RichText',
      description: 'A richText with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 60,
      indexingType: 'searchable',
      displayMode: 'available',
      editorSettings: { preset: 'expanded' },
    },
    minimalRichText: {
      type: 'richText',
      displayName: 'Minimal RichText',
      editorSettings: { preset: 'minimal' },
    },
    hiddenRichText: { type: 'richText', displayMode: 'hidden' },
  },
});

type Props = { content: ContentProps<typeof ExpRichTextProperty> };

export default function ExpRichTextPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f4e8e8', borderRadius: '4px' }}>
        {content.__typename ?? 'ExpRichTextProperty'}
      </div>
      <h1>Exp RichText Property</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="simpleRichText">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>simpleRichText</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('simpleRichText')}>{JSON.stringify(content.simpleRichText) ?? '—'}</td>
          </tr>
          <tr data-property="fullRichText">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>fullRichText</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('fullRichText')}>{JSON.stringify(content.fullRichText) ?? '—'}</td>
          </tr>
          <tr data-property="minimalRichText">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>minimalRichText</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('minimalRichText')}>{JSON.stringify(content.minimalRichText) ?? '—'}</td>
          </tr>
          <tr data-property="hiddenRichText">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>hiddenRichText</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenRichText) ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
