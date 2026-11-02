import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ExpBooleanProperty = contentType({
  key: 'ExpBooleanProperty',
  displayName: 'Exp Boolean Property',
  baseType: '_experience',
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

type Props = { content: ContentProps<typeof ExpBooleanProperty> };

export default function ExpBooleanPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f4e8e8', borderRadius: '4px' }}>
        {content.__typename ?? 'ExpBooleanProperty'}
      </div>
      <h1>Exp Boolean Property</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="simpleBool">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>simpleBool</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('simpleBool')}>{String(content.simpleBool ?? '—')}</td>
          </tr>
          <tr data-property="fullBool">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>fullBool</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('fullBool')}>{String(content.fullBool ?? '—')}</td>
          </tr>
          <tr data-property="hiddenBool">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>hiddenBool</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>{String((content as any).hiddenBool ?? '—')}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
