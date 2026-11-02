import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockDateTimeProperty = contentType({
  key: 'BlockDateTimeProperty',
  displayName: 'Block DateTime Property',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled', 'sectionEnabled'],
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

type Props = { content: ContentProps<typeof BlockDateTimeProperty> };

export default function BlockDateTimePropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockDateTimeProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleDateTime"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleDateTime</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleDateTime')}>{content.simpleDateTime ?? '—'}</td></tr>
          <tr data-property="fullDateTime"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullDateTime</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullDateTime')}>{content.fullDateTime ?? '—'}</td></tr>
          <tr data-property="hiddenDateTime"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenDateTime</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{(content as any).hiddenDateTime ?? '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
