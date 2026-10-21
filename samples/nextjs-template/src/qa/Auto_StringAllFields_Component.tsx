import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import type { AutoStringAllFields } from '@/qa/Auto_Push_PropertyTypes';

type AutoStringAllFieldsProps = {
  content: ContentProps<typeof AutoStringAllFields>;
};

export default function AutoStringAllFieldsComponent({ content }: AutoStringAllFieldsProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        color: '#666',
        marginBottom: '1rem',
        padding: '0.5rem',
        backgroundColor: '#e8f4e8',
        borderRadius: '4px',
      }}>
        {content.__typename ?? 'AutoStringAllFields'}
      </div>

      <h1 {...pa('fullString')}>{content.fullString ?? 'Auto String All Fields'}</h1>

      <table style={{
        borderCollapse: 'collapse',
        width: '100%',
        border: '1px solid #e0e0e0',
        background: '#fff',
        color: '#1a1a1a',
        marginTop: '2rem',
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="contractField">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>contractField</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
              {content.contractField ?? '—'}
            </td>
          </tr>
          <tr data-property="simpleString">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>simpleString</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('simpleString')}>
              {content.simpleString ?? '—'}
            </td>
          </tr>
          <tr data-property="fullString">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>fullString</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('fullString')}>
              {content.fullString ?? '—'}
            </td>
          </tr>
          <tr data-property="enumString">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>enumString</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('enumString')}>
              {content.enumString ?? '—'}
            </td>
          </tr>
          <tr data-property="hiddenString">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>hiddenString</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
              {content.hiddenString ?? '—'}
            </td>
          </tr>
          <tr data-property="queryableString">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>queryableString</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
              {content.queryableString ?? '—'}
            </td>
          </tr>
          <tr data-property="noIndexString">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>noIndexString</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
              {(content as any).noIndexString ?? '—'}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        fontSize: '0.9rem',
        color: '#666',
      }}>
        <div><strong>Key:</strong> {content._metadata?.key}</div>
        <div><strong>Version:</strong> {content._metadata?.version}</div>
        <div><strong>Variation:</strong> {content._metadata?.variation ?? 'BASE'}</div>
        <div><strong>Locale:</strong> {content._metadata?.locale}</div>
      </div>
    </main>
  );
}
