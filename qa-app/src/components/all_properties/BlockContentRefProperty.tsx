import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockContentRefProperty = contentType({
  key: 'BlockContentRefProperty',
  displayName: 'Block ContentReference Property',
  baseType: '_component',
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

type Props = { content: ContentProps<typeof BlockContentRefProperty> };

export default function BlockContentRefPropertyComponent({ content }: Props) {
  const { pa, src } = getPreviewUtils(content);
  const imageSrc = src(content.imageRef);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockContentRefProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleRef"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleRef</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleRef')}>{JSON.stringify(content.simpleRef) ?? '—'}</td></tr>
          <tr data-property="fullRef"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullRef</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullRef')}>{JSON.stringify(content.fullRef) ?? '—'}</td></tr>
          <tr data-property="imageRef"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>imageRef</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('imageRef')}>{imageSrc ? <><img src={imageSrc} alt="imageRef" style={{ maxWidth: '300px', display: 'block', marginBottom: '0.25rem' }} /><span style={{ fontSize: '0.75rem', color: '#666' }}>{imageSrc}</span></> : '—'}</td></tr>
          <tr data-property="hiddenRef"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenRef</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenRef) ?? '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
