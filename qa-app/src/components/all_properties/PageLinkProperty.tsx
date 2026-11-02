import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const PageLinkProperty = contentType({
  key: 'PageLinkProperty',
  displayName: 'Page Link Property',
  baseType: '_page',
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

type Props = { content: ContentProps<typeof PageLinkProperty> };

export default function PageLinkPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#888', padding: '0.25rem 0.5rem', backgroundColor: '#e8f4e8', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem' }}>
        {content.__typename ?? 'PageLinkProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0' }}>
        <thead><tr><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="simpleLink"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleLink</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleLink')}>{typeof content.simpleLink === 'object' ? JSON.stringify(content.simpleLink) : (content.simpleLink ?? '—')}</td></tr>
          <tr data-property="fullLink"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullLink</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullLink')}>{typeof content.fullLink === 'object' ? JSON.stringify(content.fullLink) : (content.fullLink ?? '—')}</td></tr>
          <tr data-property="hiddenLink"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenLink</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{typeof (content as any).hiddenLink === 'object' ? JSON.stringify((content as any).hiddenLink) : ((content as any).hiddenLink ?? '—')}</td></tr>
        </tbody>
      </table>
    </main>
  );
}
