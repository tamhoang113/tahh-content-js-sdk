import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ExpIntegerProperty = contentType({
  key: 'ExpIntegerProperty',
  displayName: 'Exp Integer Property',
  baseType: '_experience',
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

type Props = { content: ContentProps<typeof ExpIntegerProperty> };

export default function ExpIntegerPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f4e8e8', borderRadius: '4px' }}>
        {content.__typename ?? 'ExpIntegerProperty'}
      </div>
      <h1>Exp Integer Property</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="simpleInt">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>simpleInt</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('simpleInt')}>{String(content.simpleInt ?? '—')}</td>
          </tr>
          <tr data-property="fullInt">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>fullInt</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('fullInt')}>{String(content.fullInt ?? '—')}</td>
          </tr>
          <tr data-property="enumInt">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>enumInt</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('enumInt')}>{String(content.enumInt ?? '—')}</td>
          </tr>
          <tr data-property="hiddenInt">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>hiddenInt</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>{String((content as any).hiddenInt ?? '—')}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
