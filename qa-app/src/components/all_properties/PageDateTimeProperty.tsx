import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const PageDateTimeProperty = contentType({
  key: 'PageDateTimeProperty',
  displayName: 'Page DateTime Property',
  baseType: '_page',
  properties: {
    simpleDateTime: { type: 'dateTime' },
    fullDateTime: {
      type: 'dateTime',
      displayName: 'Full DateTime',
      description: 'A dateTime with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 50,
      indexingType: 'queryable',
      displayMode: 'available',
      minimum: '2020-01-01T00:00:00Z',
      maximum: '2030-12-31T23:59:59Z',
    },
    hiddenDateTime: { type: 'dateTime', displayMode: 'hidden' },
  },
});

type Props = { content: ContentProps<typeof PageDateTimeProperty> };

export default function PageDateTimePropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8f4e8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'PageDateTimeProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleDateTime"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleDateTime</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleDateTime')}>{content.simpleDateTime ?? '—'}</td></tr>
          <tr data-property="fullDateTime"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullDateTime</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullDateTime')}>{content.fullDateTime ?? '—'}</td></tr>
          <tr data-property="hiddenDateTime"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenDateTime</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{(content as any).hiddenDateTime ?? '—'}</td></tr>
        </tbody>
      </table>
    </main>
  );
}
