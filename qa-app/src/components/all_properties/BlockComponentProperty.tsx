import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { BlockStringProperty } from './BlockStringProperty';

export const BlockComponentProperty = contentType({
  key: 'BlockComponentProperty',
  displayName: 'Block Component Property',
  baseType: '_component',
  properties: {
    simpleComponent: {
      type: 'component',
      contentType: BlockStringProperty,
    },
    fullComponent: {
      type: 'component',
      contentType: BlockStringProperty,
      displayName: 'Full Component',
      description: 'A component property with fields set',
      isRequired: false,
      isLocalized: false,
      group: 'Content',
      sortOrder: 120,
      displayMode: 'available',
    },
    hiddenComponent: {
      type: 'component',
      contentType: BlockStringProperty,
      displayMode: 'hidden',
    },
  },
});

type Props = { content: ContentProps<typeof BlockComponentProperty> };

export default function BlockComponentPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'BlockComponentProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleComponent"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleComponent</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify(content.simpleComponent) ?? '—'}</td></tr>
          <tr data-property="fullComponent"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullComponent</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullComponent')}>{JSON.stringify(content.fullComponent) ?? '—'}</td></tr>
          <tr data-property="hiddenComponent"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenComponent</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenComponent) ?? '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
