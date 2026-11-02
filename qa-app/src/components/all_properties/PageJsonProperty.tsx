import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const PageJsonProperty = contentType({
  key: 'PageJsonProperty',
  displayName: 'Page Json Property',
  baseType: '_page',
  properties: {
    simpleJson: { type: 'json' },
    fullJson: {
      type: 'json',
      displayName: 'Full Json',
      description: 'A json with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 90,
      indexingType: 'queryable',
      displayMode: 'available',
    },
    hiddenJson: { type: 'json', displayMode: 'hidden' },
  },
});

type Props = { content: ContentProps<typeof PageJsonProperty> };

export default function PageJsonPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8f4e8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'PageJsonProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleJson"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleJson</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleJson')}>{JSON.stringify(content.simpleJson) ?? '—'}</td></tr>
          <tr data-property="fullJson"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullJson</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullJson')}>{JSON.stringify(content.fullJson) ?? '—'}</td></tr>
          <tr data-property="hiddenJson"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenJson</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenJson) ?? '—'}</td></tr>
        </tbody>
      </table>
    </main>
  );
}
