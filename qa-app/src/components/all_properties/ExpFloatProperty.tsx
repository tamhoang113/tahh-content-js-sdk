import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ExpFloatProperty = contentType({
  key: 'ExpFloatProperty',
  displayName: 'Exp Float Property',
  baseType: '_experience',
  properties: {
    simpleFloat: { type: 'float' },
    fullFloat: {
      type: 'float',
      displayName: 'Full Float',
      description: 'A float with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 40,
      indexingType: 'queryable',
      displayMode: 'available',
      minimum: 0.0,
      maximum: 99.99,
    },
    enumFloat: {
      type: 'float',
      displayName: 'Enum Float',
      enum: [
        { value: 0.5, displayName: 'Half' },
        { value: 1.0, displayName: 'One' },
        { value: 1.5, displayName: 'One and Half' },
      ],
    },
    hiddenFloat: { type: 'float', displayMode: 'hidden' },
  },
});

type Props = { content: ContentProps<typeof ExpFloatProperty> };

export default function ExpFloatPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f4e8e8', borderRadius: '4px' }}>
        {content.__typename ?? 'ExpFloatProperty'}
      </div>
      <h1>Exp Float Property</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="simpleFloat">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>simpleFloat</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('simpleFloat')}>{String(content.simpleFloat ?? '—')}</td>
          </tr>
          <tr data-property="fullFloat">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>fullFloat</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('fullFloat')}>{String(content.fullFloat ?? '—')}</td>
          </tr>
          <tr data-property="enumFloat">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>enumFloat</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('enumFloat')}>{String(content.enumFloat ?? '—')}</td>
          </tr>
          <tr data-property="hiddenFloat">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>hiddenFloat</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>{String((content as any).hiddenFloat ?? '—')}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
