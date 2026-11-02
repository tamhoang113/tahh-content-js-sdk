import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const PageRichTextProperty = contentType({
  key: 'PageRichTextProperty',
  displayName: 'Page RichText Property',
  baseType: '_page',
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

type Props = { content: ContentProps<typeof PageRichTextProperty> };

export default function PageRichTextPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8f4e8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'PageRichTextProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleRichText"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleRichText</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleRichText')}>{content.simpleRichText ?? '—'}</td></tr>
          <tr data-property="fullRichText"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullRichText</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullRichText')}>{content.fullRichText ?? '—'}</td></tr>
          <tr data-property="minimalRichText"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>minimalRichText</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('minimalRichText')}>{content.minimalRichText ?? '—'}</td></tr>
          <tr data-property="hiddenRichText"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenRichText</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{(content as any).hiddenRichText ?? '—'}</td></tr>
        </tbody>
      </table>
    </main>
  );
}
