import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const PageUrlProperty = contentType({
  key: 'PageUrlProperty',
  displayName: 'Page Url Property',
  baseType: '_page',
  properties: {
    simpleUrl: { type: 'url' },
    fullUrl: {
      type: 'url',
      displayName: 'Full Url',
      description: 'A url with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 70,
      displayMode: 'available',
    },
    hiddenUrl: { type: 'url', displayMode: 'hidden' },
  },
});

type Props = { content: ContentProps<typeof PageUrlProperty> };

export default function PageUrlPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8f4e8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'PageUrlProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleUrl"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleUrl</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleUrl')}>{content.simpleUrl ?? '—'}</td></tr>
          <tr data-property="fullUrl"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullUrl</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullUrl')}>{content.fullUrl ?? '—'}</td></tr>
          <tr data-property="hiddenUrl"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenUrl</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{(content as any).hiddenUrl ?? '—'}</td></tr>
        </tbody>
      </table>
    </main>
  );
}
