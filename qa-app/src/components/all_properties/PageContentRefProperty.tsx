import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const PageContentRefProperty = contentType({
  key: 'PageContentRefProperty',
  displayName: 'Page ContentReference Property',
  baseType: '_page',
  properties: {
    simpleRef: {
      type: 'contentReference',
      allowedTypes: ['_page'],
    },
    fullRef: {
      type: 'contentReference',
      displayName: 'Full ContentReference',
      description: 'A contentReference with every field set',
      isRequired: false,
      isLocalized: false,
      group: 'Content',
      sortOrder: 110,
      displayMode: 'available',
      allowedTypes: ['_page', '_image'],
    },
    hiddenRef: {
      type: 'contentReference',
      displayMode: 'hidden',
      allowedTypes: ['_page'],
    },
    imageRef: {
      type: 'contentReference',
      displayName: 'Image Reference',
      allowedTypes: ['_image'],
    },
  },
});

type Props = { content: ContentProps<typeof PageContentRefProperty> };

export default function PageContentRefPropertyComponent({ content }: Props) {
  const { pa, src } = getPreviewUtils(content);
  const imageSrc = src(content.imageRef);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8f4e8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'PageContentRefProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleRef"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleRef</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleRef')}>{JSON.stringify(content.simpleRef) ?? '—'}</td></tr>
          <tr data-property="fullRef"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullRef</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullRef')}>{JSON.stringify(content.fullRef) ?? '—'}</td></tr>
          <tr data-property="imageRef"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>imageRef</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('imageRef')}>{imageSrc ? <><img src={imageSrc} alt="imageRef" style={{ maxWidth: '300px', display: 'block', marginBottom: '0.25rem' }} /><span style={{ fontSize: '0.75rem', color: '#666' }}>{imageSrc}</span></> : '—'}</td></tr>
          <tr data-property="hiddenRef"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenRef</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenRef) ?? '—'}</td></tr>
        </tbody>
      </table>
    </main>
  );
}
