import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ExpUrlProperty = contentType({
  key: 'ExpUrlProperty',
  displayName: 'Exp Url Property',
  baseType: '_experience',
  properties: {
    simpleUrl: { type: 'url' },
    fullUrl: {
      type: 'url',
      displayName: 'Full Url',
      description: 'A url with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 70,
      displayMode: 'available',
    },
    hiddenUrl: { type: 'url', displayMode: 'hidden' },
  },
});

type Props = { content: ContentProps<typeof ExpUrlProperty> };

export default function ExpUrlPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f4e8e8', borderRadius: '4px' }}>
        {content.__typename ?? 'ExpUrlProperty'}
      </div>
      <h1>Exp Url Property</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="simpleUrl">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>simpleUrl</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('simpleUrl')}>{content.simpleUrl ?? '—'}</td>
          </tr>
          <tr data-property="fullUrl">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>fullUrl</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('fullUrl')}>{content.fullUrl ?? '—'}</td>
          </tr>
          <tr data-property="hiddenUrl">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>hiddenUrl</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>{(content as any).hiddenUrl ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
