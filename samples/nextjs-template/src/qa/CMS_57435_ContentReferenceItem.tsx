import React from 'react';
import { contentType, ContentProps, damAssets } from '@optimizely/cms-sdk';
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

      {/* ── AC: isDamImageAsset / isDamVideoAsset / isDamRawFileAsset still narrow ── */}
      {(() => {
        const { isDamImageAsset, isDamVideoAsset, isDamRawFileAsset, isDamAsset, getAlt, getDamAssetType, getSrcset } = damAssets(content);
        const ref = content.heroImage;
        const isImg = isDamImageAsset(ref);
        const isVid = isDamVideoAsset(ref);
        const isRaw = isDamRawFileAsset(ref);
        const isDam = isDamAsset(ref);
        const damType = getDamAssetType(ref);
        const alt = getAlt(ref, '(no alt)');
        const srcset = getSrcset(ref);
        const item = ref?.item as any;
        return (
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              border: '1px solid #e0e0e0',
              background: '#fffbe6',
              color: '#1a1a1a',
              marginBottom: '1rem',
            }}
          >
            <thead>
              <tr>
                <th colSpan={3} style={{ textAlign: 'left', padding: '0.5rem', background: '#fff3cd' }}>
                  AC: Type Guard + DAM Asset Verification (heroImage)
                </th>
              </tr>
              <tr>
                <th>Check</th>
                <th>Result</th>
                <th>Expected</th>
              </tr>
            </thead>
            <tbody>
              <tr data-property="guard-typename">
                <td>item.__typename</td>
                <td data-col="value">{item?.__typename ?? '—'}</td>
                <td>ImageMedia (CMS) or cmp_PublicImageAsset (DAM)</td>
              </tr>
              <tr data-property="guard-isDamImageAsset">
                <td>isDamImageAsset(heroImage)</td>
                <td data-col="value" style={{ color: isImg ? 'green' : '#888' }}>{String(isImg)}</td>
                <td>true if DAM image, false if CMS media</td>
              </tr>
              <tr data-property="guard-isDamVideoAsset">
                <td>isDamVideoAsset(heroImage)</td>
                <td data-col="value">{String(isVid)}</td>
                <td>true if DAM video</td>
              </tr>
              <tr data-property="guard-isDamRawFileAsset">
                <td>isDamRawFileAsset(heroImage)</td>
                <td data-col="value">{String(isRaw)}</td>
                <td>true if DAM raw file</td>
              </tr>
              <tr data-property="guard-isDamAsset">
                <td>isDamAsset(heroImage)</td>
                <td data-col="value" style={{ fontWeight: 700 }}>{String(isDam)}</td>
                <td>true if any DAM type, false if CMS media</td>
              </tr>
              <tr data-property="guard-getDamAssetType">
                <td>getDamAssetType(heroImage)</td>
                <td data-col="value" style={{ fontWeight: 700 }}>{damType}</td>
                <td>image / video / file / unknown</td>
              </tr>
              <tr data-property="guard-getAlt">
                <td>getAlt(heroImage, &apos;(no alt)&apos;)</td>
                <td data-col="value">{alt}</td>
                <td>AltText value or fallback</td>
              </tr>
              <tr data-property="guard-getSrcset">
                <td>getSrcset(heroImage)</td>
                <td data-col="value" style={{ maxWidth: 400, wordBreak: 'break-all', fontSize: '0.8rem' }}>{srcset ?? '(undefined — no Renditions)'}</td>
                <td>srcset string if DAM with Renditions</td>
              </tr>

              {/* DAM-specific fields (PublicImageAsset) */}
              <tr><td colSpan={3} style={{ background: '#f0f0f0', fontWeight: 700, padding: '0.3rem' }}>DAM Image Asset Fields</td></tr>
              <tr data-property="dam-Url">
                <td>item.Url</td>
                <td data-col="value" style={{ maxWidth: 400, wordBreak: 'break-all', fontSize: '0.8rem' }}>{item?.Url ?? '—'}</td>
                <td>DAM asset URL</td>
              </tr>
              <tr data-property="dam-Title">
                <td>item.Title</td>
                <td data-col="value">{item?.Title ?? '—'}</td>
                <td>DAM title</td>
              </tr>
              <tr data-property="dam-Description">
                <td>item.Description</td>
                <td data-col="value">{item?.Description ?? '—'}</td>
                <td>DAM description</td>
              </tr>
              <tr data-property="dam-AltText">
                <td>item.AltText</td>
                <td data-col="value">{item?.AltText ?? '—'}</td>
                <td>Alt text</td>
              </tr>
              <tr data-property="dam-MimeType">
                <td>item.MimeType</td>
                <td data-col="value">{item?.MimeType ?? '—'}</td>
                <td>MIME type</td>
              </tr>
              <tr data-property="dam-Width">
                <td>item.Width</td>
                <td data-col="value">{item?.Width ?? '—'}</td>
                <td>Image width (DAM)</td>
              </tr>
              <tr data-property="dam-Height">
                <td>item.Height</td>
                <td data-col="value">{item?.Height ?? '—'}</td>
                <td>Image height (DAM)</td>
              </tr>
              <tr data-property="dam-FocalPoint">
                <td>item.FocalPoint</td>
                <td data-col="value">{item?.FocalPoint ? `X: ${item.FocalPoint.X}, Y: ${item.FocalPoint.Y}` : '—'}</td>
                <td>Focal point (DAM image only)</td>
              </tr>
              <tr data-property="dam-Tags">
                <td>item.Tags</td>
                <td data-col="value" style={{ fontSize: '0.8rem' }}>{item?.Tags?.length ? JSON.stringify(item.Tags) : '—'}</td>
                <td>DAM tags</td>
              </tr>
              <tr data-property="dam-Renditions">
                <td>item.Renditions</td>
                <td data-col="value" style={{ maxWidth: 400, wordBreak: 'break-all', fontSize: '0.75rem' }}>
                  {item?.Renditions?.length
                    ? item.Renditions.map((r: any, i: number) => (
                        <div key={i}>{r.Name}: {r.Width}x{r.Height}</div>
                      ))
                    : '—'}
                </td>
                <td>Rendition list (Name, Width x Height)</td>
              </tr>
            </tbody>
          </table>
        );
      })()}

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
