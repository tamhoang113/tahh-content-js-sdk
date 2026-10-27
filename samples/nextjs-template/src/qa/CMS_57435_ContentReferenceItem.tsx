import React from 'react';
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

// ── Content Types ───────────────────────────────────────────────────────────

export const CMS57435ImageMedia = contentType({
  key: 'ImageMedia',
  displayName: 'Image Media',
  baseType: '_image',
  properties: {
    AltText: { type: 'string', displayName: 'Alt Text' },
  },
});

export const CMS57435ArticlePage = contentType({
  key: 'CMS57435ArticlePage',
  displayName: 'CMS57435 Article Page',
  baseType: '_page',
  properties: {
    title: { type: 'string', displayName: 'Title', isRequired: true },
    heroImage: {
      type: 'contentReference',
      displayName: 'Hero Image',
      allowedTypes: [CMS57435ImageMedia],
    },
    gallery: {
      type: 'array',
      displayName: 'Gallery',
      items: { type: 'contentReference', allowedTypes: [CMS57435ImageMedia] },
    },
  },
});

// ── React Component ─────────────────────────────────────────────────────────

type CMS57435ArticlePageProps = {
  content: ContentProps<typeof CMS57435ArticlePage>;
};

export default function CMS57435ArticlePageComponent({
  content,
}: CMS57435ArticlePageProps) {
  const { pa } = getPreviewUtils(content);

  const renderImageRef = (
    label: string,
    ref: any | null | undefined,
  ) => {
    if (!ref) return <tr data-property={label.toLowerCase().replace(/ /g, '-')}><td>{label}</td><td data-col="value">—</td><td>contentReference with item metadata</td></tr>;

    const item = ref.item as any;
    return (
      <>
        <tr data-property={`${label.toLowerCase().replace(/ /g, '-')}-key`}>
          <td>{label} → key</td>
          <td data-col="value">{ref.key ?? '—'}</td>
          <td>GUID key</td>
        </tr>
        <tr data-property={`${label.toLowerCase().replace(/ /g, '-')}-url`}>
          <td>{label} → url</td>
          <td data-col="value">{ref.url?.default ?? ref.url?.hierarchical ?? '—'}</td>
          <td>Image URL</td>
        </tr>
        <tr data-property={`${label.toLowerCase().replace(/ /g, '-')}-typename`}>
          <td>{label} → item.__typename</td>
          <td data-col="value">{item?.__typename ?? '—'}</td>
          <td>Image type name</td>
        </tr>
        <tr data-property={`${label.toLowerCase().replace(/ /g, '-')}-metadata-displayname`}>
          <td>{label} → item._metadata.displayName</td>
          <td data-col="value">{item?._metadata?.displayName ?? '—'}</td>
          <td>Content display name</td>
        </tr>
        <tr data-property={`${label.toLowerCase().replace(/ /g, '-')}-assetmetadata-mimetype`}>
          <td>{label} → item.assetMetadata.mimeType</td>
          <td data-col="value">{item?.assetMetadata?.mimeType ?? '—'}</td>
          <td>MIME type</td>
        </tr>
        <tr data-property={`${label.toLowerCase().replace(/ /g, '-')}-imagemetadata-width`}>
          <td>{label} → item.imageMetadata.width</td>
          <td data-col="value">{item?.imageMetadata?.width ?? '—'}</td>
          <td>Image width px</td>
        </tr>
        <tr data-property={`${label.toLowerCase().replace(/ /g, '-')}-imagemetadata-height`}>
          <td>{label} → item.imageMetadata.height</td>
          <td data-col="value">{item?.imageMetadata?.height ?? '—'}</td>
          <td>Image height px</td>
        </tr>
      </>
    );
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: '#888',
        }}
      >
        {content.__typename ?? 'CMS57435ArticlePage'}
      </div>
      <h1 {...pa('title')}>{content.title ?? 'CMS57435 Test Page'}</h1>

      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          border: '1px solid #e0e0e0',
          background: '#fff',
          color: '#1a1a1a',
        }}
      >
        <thead>
          <tr>
            <th>Property</th>
            <th>Value</th>
            <th>Expected</th>
          </tr>
        </thead>
        <tbody>
          <tr data-property="title">
            <td>content.title</td>
            <td data-col="value" {...pa('title')}>
              {content.title ?? '—'}
            </td>
            <td>Article title</td>
          </tr>
          {renderImageRef('heroImage', content.heroImage)}
          <tr data-property="gallery-count">
            <td>gallery.length</td>
            <td data-col="value">{content.gallery?.length ?? 0}</td>
            <td>Number of gallery images</td>
          </tr>
          {content.gallery?.map((ref, i) => (
            <React.Fragment key={i}>
              {renderImageRef(`gallery[${i}]`, ref as any)}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </main>
  );
}
