import { contentType, ContentProps, damAssets, contract } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

export const CMS54651TeaserContract = contract({
  key: 'CMS54651TeaserContract',
  displayName: 'CMS54651 Teaser Contract',
  properties: {
    teaserTitle: { type: 'string' },
    teaserDescription: { type: 'string' },
  },
});

export const CMS54651AnotherContract = contract({
  key: 'CMS54651AnotherContract',
  displayName: 'CMS54651 Another Contract',
  properties: {
    anotherField: { type: 'string' },
  },
});

export const CMS54651PageWithMultipleContracts = contentType({
  baseType: '_page',
  key: 'CMS54651PageWithMultipleContracts',
  displayName: 'CMS54651 Page With Multiple Contracts',
  extends: [CMS54651TeaserContract, CMS54651AnotherContract],
  properties: { title: { type: 'string' } },
});

interface TestingProps {
  content: ContentProps<typeof CMS54651PageWithMultipleContracts>
}

export function TestingComponent({ content }: TestingProps) {
  const { pa } = getPreviewUtils(content);
  var teaserDescription = content.teaserDescription;
  var teaserTitle = content.teaserTitle;
  var anotherField = content.anotherField;
  var title = content.title;

  return (
    <div>
      <h1 {...pa('title')}>{content.title ?? 'Testing Component'}</h1>
    </div>
  );
}

export const CMS54651CardContentType = contentType({
  baseType: '_page',
  key: 'CMS54651CardContentType',
  displayName: 'CMS54651 Card Content Type',
  properties: { cardTitle: { type: 'string' } },
});

export const CMS54651PageWithContentArray = contentType({
  baseType: '_page',
  key: 'CMS54651PageWithContentArray',
  displayName: 'CMS54651 Page With Content Array',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [CMS54651CardContentType, CMS54651TeaserContract],
      },
    },
    // contactInfo: {
    //   type: 'richText',
    //   displayName: 'Contact info',
    //   isLocalized: true,
    //   isRequired: false,
    //   sortOrder: 20,
    //   allowedTypes: [],
    //   restrictedTypes: [],
    //   editorSettings: {
    //     preset: 'expanded',
    //   },
    // },
  },
});

type CMS54651PageWithMultipleContractsProps = {
  content: ContentProps<typeof CMS54651PageWithMultipleContracts>;
};

export function CMS54651PageWithMultipleContractsComponent({ content }: CMS54651PageWithMultipleContractsProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 {...pa('title')} style={{ marginBottom: '1.5rem' }}>
        {content.title ?? 'CMS54651 Page With Multiple Contracts'}
      </h1>
      <section style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#555' }}>Teaser Contract</h2>
        <p {...pa('teaserTitle')} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
          {content.teaserTitle}
        </p>
        <p {...pa('teaserDescription')}>{content.teaserDescription}</p>
      </section>
      <section style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#555' }}>Another Contract</h2>
        <p {...pa('anotherField')}>{content.anotherField}</p>
      </section>
    </main>
  );
}

type CMS54651CardContentTypeProps = {
  content: ContentProps<typeof CMS54651CardContentType>;
};

export function CMS54651CardContentTypeComponent({ content }: CMS54651CardContentTypeProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem' }}>
      <h3 {...pa('cardTitle')} style={{ margin: 0 }}>
        {content.cardTitle ?? 'Untitled Card'}
      </h3>
    </div>
  );
}

type CMS54651PageWithContentArrayProps = {
  content: ContentProps<typeof CMS54651PageWithContentArray>;
};

export default function CMS54651PageWithContentArrayComponent({ content }: CMS54651PageWithContentArrayProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>CMS54651 Page With Content Array</h1>

      <section>
        <h2 style={{ marginBottom: '1rem' }}>Items ({content.items?.length ?? 0})</h2>
        <div {...pa('items')} style={{ display: 'grid', gap: '1rem' }}>
          {content.items && content.items.length > 0 ? (
            content.items.map((item, index) => (
              <div
                key={index}
                style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem' }}
              >
                <OptimizelyComponent content={item} />
              </div>
            ))
          ) : (
            <p style={{ color: '#9e9e9e', fontStyle: 'italic' }}>No items</p>
          )}
        </div>
      </section>
    </main>
  );
}


