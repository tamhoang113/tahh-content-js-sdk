import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockJsonProperty = contentType({
  key: 'BlockJsonProperty',
  displayName: 'Block Json Property',
  baseType: '_component',
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

type Props = { content: ContentProps<typeof BlockJsonProperty> };

export default function BlockJsonPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockJsonProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleJson"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleJson</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleJson')}>{JSON.stringify(content.simpleJson) ?? '—'}</td></tr>
          <tr data-property="fullJson"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullJson</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullJson')}>{JSON.stringify(content.fullJson) ?? '—'}</td></tr>
          <tr data-property="hiddenJson"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenJson</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenJson) ?? '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
