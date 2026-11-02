import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockBooleanProperty = contentType({
  key: 'BlockBooleanProperty',
  displayName: 'Block Boolean Property',
  baseType: '_component',
  properties: {
    simpleBool: { type: 'boolean' },
    fullBool: {
      type: 'boolean',
      displayName: 'Full Boolean',
      description: 'A boolean with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 20,
      indexingType: 'queryable',
      displayMode: 'available',
    },
    hiddenBool: { type: 'boolean', displayMode: 'hidden' },
  },
});

type Props = { content: ContentProps<typeof BlockBooleanProperty> };

export default function BlockBooleanPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockBooleanProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleBool"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleBool</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleBool')}>{String(content.simpleBool ?? '—')}</td></tr>
          <tr data-property="fullBool"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullBool</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullBool')}>{String(content.fullBool ?? '—')}</td></tr>
          <tr data-property="hiddenBool"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenBool</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{String((content as any).hiddenBool ?? '—')}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
