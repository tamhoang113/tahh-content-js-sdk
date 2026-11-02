import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ExpContentItemProperty = contentType({
  key: 'ExpContentItemProperty',
  displayName: 'Exp ContentItem Property',
  baseType: '_experience',
  properties: {
    simpleContent: { type: 'content', allowedTypes: ['_page'] },
    fullContent: {
      type: 'content',
      displayName: 'Full ContentAreaItem',
      description: 'A content item with every field set',
      isRequired: false,
      isLocalized: false,
      group: 'Content',
      sortOrder: 130,
      displayMode: 'available',
      allowedTypes: ['_page', '_component'],
    },
    contentWithRestricted: {
      type: 'content',
      displayName: 'ContentAreaItem with RestrictedTypes',
      restrictedTypes: ['_folder', '_media'],
    },
    hiddenContent: { type: 'content', displayMode: 'hidden', allowedTypes: ['_page'] },
  },
});

type Props = { content: ContentProps<typeof ExpContentItemProperty> };

export default function ExpContentItemPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#666', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f4e8e8', borderRadius: '4px' }}>
        {content.__typename ?? 'ExpContentItemProperty'}
      </div>
      <h1>Exp ContentItem Property</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="simpleContent">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>simpleContent</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('simpleContent')}>{JSON.stringify(content.simpleContent) ?? '—'}</td>
          </tr>
          <tr data-property="fullContent">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>fullContent</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('fullContent')}>{JSON.stringify(content.fullContent) ?? '—'}</td>
          </tr>
          <tr data-property="contentWithRestricted">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>contentWithRestricted</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }} {...pa('contentWithRestricted')}>{JSON.stringify(content.contentWithRestricted) ?? '—'}</td>
          </tr>
          <tr data-property="hiddenContent">
            <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>hiddenContent</td>
            <td data-col="value" style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>{JSON.stringify((content as any).hiddenContent) ?? '—'}</td>
          </tr>
        </tbody>
      </table>
    </main>
  );
}
