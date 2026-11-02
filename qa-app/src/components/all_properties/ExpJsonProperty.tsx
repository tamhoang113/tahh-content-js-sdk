import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ExpJsonProperty = contentType({
  key: 'ExpJsonProperty',
  displayName: 'Exp Json Property',
  baseType: '_experience',
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

type Props = { content: ContentProps<typeof ExpJsonProperty> };

export default function ExpJsonPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f4e8e8', borderRadius: '4px' }}>
        {content.__typename ?? 'ExpJsonProperty'}
      </div>
      <h1>Exp Json Property</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="simpleJson">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>simpleJson</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('simpleJson')}>{JSON.stringify(content.simpleJson) ?? '—'}</td>
          </tr>
          <tr data-property="fullJson">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>fullJson</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('fullJson')}>{JSON.stringify(content.fullJson) ?? '—'}</td>
          </tr>
          <tr data-property="hiddenJson">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>hiddenJson</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenJson) ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
