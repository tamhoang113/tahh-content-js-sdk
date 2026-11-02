import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockUrlProperty = contentType({
  key: 'BlockUrlProperty',
  displayName: 'Block Url Property',
  baseType: '_component',
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

type Props = { content: ContentProps<typeof BlockUrlProperty> };

export default function BlockUrlPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockUrlProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleUrl"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleUrl</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleUrl')}>{content.simpleUrl ?? '—'}</td></tr>
          <tr data-property="fullUrl"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullUrl</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullUrl')}>{content.fullUrl ?? '—'}</td></tr>
          <tr data-property="hiddenUrl"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenUrl</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{(content as any).hiddenUrl ?? '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
