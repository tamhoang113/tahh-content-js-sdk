import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { BlockStringProperty } from './BlockStringProperty';

export const PageComponentProperty = contentType({
  key: 'PageComponentProperty',
  displayName: 'Page Component Property',
  baseType: '_page',
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

type Props = { content: ContentProps<typeof PageComponentProperty> };

export default function PageComponentPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8f4e8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'PageComponentProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleComponent"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleComponent</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify(content.simpleComponent) ?? '—'}</td></tr>
          <tr data-property="fullComponent"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullComponent</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullComponent')}>{JSON.stringify(content.fullComponent) ?? '—'}</td></tr>
          <tr data-property="hiddenComponent"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenComponent</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenComponent) ?? '—'}</td></tr>
        </tbody>
      </table>
    </main>
  );
}
