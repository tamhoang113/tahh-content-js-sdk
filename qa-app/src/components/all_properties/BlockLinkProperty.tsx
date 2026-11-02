import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BlockLinkProperty = contentType({
  key: 'BlockLinkProperty',
  displayName: 'Block Link Property',
  baseType: '_component',
  properties: {
    simpleLink: { type: 'link' },
    fullLink: {
      type: 'link',
      displayName: 'Full Link',
      description: 'A link with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 80,
      displayMode: 'available',
    },
    hiddenLink: { type: 'link', displayMode: 'hidden' },
  },
});

type Props = { content: ContentProps<typeof BlockLinkProperty> };

export default function BlockLinkPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockLinkProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleLink"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleLink</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleLink')}>{typeof content.simpleLink === 'object' ? JSON.stringify(content.simpleLink) : (content.simpleLink ?? '—')}</td></tr>
          <tr data-property="fullLink"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullLink</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullLink')}>{typeof content.fullLink === 'object' ? JSON.stringify(content.fullLink) : (content.fullLink ?? '—')}</td></tr>
          <tr data-property="hiddenLink"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenLink</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{typeof (content as any).hiddenLink === 'object' ? JSON.stringify((content as any).hiddenLink) : ((content as any).hiddenLink ?? '—')}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
