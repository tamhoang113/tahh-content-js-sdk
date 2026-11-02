import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockIntegerProperty = contentType({
  key: 'BlockIntegerProperty',
  displayName: 'Block Integer Property',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled', 'sectionEnabled'],
  properties: {
    simpleInt: { type: 'integer' },
    fullInt: {
      type: 'integer',
      displayName: 'Full Integer',
      description: 'An integer with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 30,
      indexingType: 'searchable',
      displayMode: 'available',
      minimum: 0,
      maximum: 1000,
    },
    enumInt: {
      type: 'integer',
      displayName: 'Enum Integer',
      enum: [
        { value: 1, displayName: 'One' },
        { value: 2, displayName: 'Two' },
        { value: 3, displayName: 'Three' },
      ],
    },
    hiddenInt: { type: 'integer', displayMode: 'hidden' },
  },
});

type Props = { content: ContentProps<typeof BlockIntegerProperty> };

export default function BlockIntegerPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockIntegerProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleInt"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleInt</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleInt')}>{String(content.simpleInt ?? '—')}</td></tr>
          <tr data-property="fullInt"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullInt</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullInt')}>{String(content.fullInt ?? '—')}</td></tr>
          <tr data-property="enumInt"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>enumInt</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('enumInt')}>{String(content.enumInt ?? '—')}</td></tr>
          <tr data-property="hiddenInt"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenInt</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{String((content as any).hiddenInt ?? '—')}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
