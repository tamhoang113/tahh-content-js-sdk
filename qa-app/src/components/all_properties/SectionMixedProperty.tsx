import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const SectionMixedProperty = contentType({
  key: 'SectionMixedProperty',
  displayName: 'Section Mixed Property',
  baseType: '_section',
  properties: {
    pString: {
      type: 'string',
      displayName: 'String',
    },
    pRichText: {
      type: 'richText',
      displayName: 'RichText',
    },
    pContentReference: {
      type: 'contentReference',
      displayName: 'Content Reference',
      allowedTypes: ['_page', '_image'],
    },
  },
});

type Props = { content: ContentProps<typeof SectionMixedProperty> };

export default function SectionMixedPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#f0e8f4', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'SectionMixedProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="pString"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>pString</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('pString')}>{content.pString ?? '—'}</td></tr>
          <tr data-property="pRichText"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>pRichText</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('pRichText')}>{JSON.stringify(content.pRichText) ?? '—'}</td></tr>
          <tr data-property="pContentReference"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>pContentReference</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('pContentReference')}>{JSON.stringify(content.pContentReference) ?? '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
