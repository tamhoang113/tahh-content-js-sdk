import { contentType, ContentProps, contract } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

// ─── Contracts ───────────────────────────────────────────────────────────────

/**
 * CMS-54935: Empty contract used as allowedTypes in an array property.
 * Bug: when expandContracts:true, handleArrayProperty dropped the option
 * so concrete implementing types were never included in the GraphQL fragment.
 */
export const CMS54935CommonCardContract = contract({
  key: 'CMS54935CommonCardContract',
  displayName: 'CMS54935 Common Card Contract',
});

// ─── Concrete types implementing the contract ─────────────────────────────────

export const CMS54935CardComponentA = contentType({
  baseType: '_component',
  key: 'CMS54935CardComponentA',
  displayName: 'CMS54935 Card Component A',
  extends: [CMS54935CommonCardContract],
  compositionBehaviors: ['elementEnabled'],
  properties: {
    cardTitle: { type: 'string' },
    cardDescription: { type: 'string' },
  },
});

export const CMS54935CardComponentB = contentType({
  baseType: '_component',
  key: 'CMS54935CardComponentB',
  displayName: 'CMS54935 Card Component B',
  extends: [CMS54935CommonCardContract],
  compositionBehaviors: ['elementEnabled'],
  properties: {
    cardTitle: { type: 'string' },
    cardImage: { type: 'string' },
  },
});

// ─── Container with array property using contract in allowedTypes ─────────────

/**
 * Key content type for bug reproduction.
 * `cards` is an array property whose items reference the contract.
 * With expandContracts:true, the query must include fragments for
 * CMS54935CardComponentA and CMS54935CardComponentB — not just the contract.
 */
export const CMS54935CardContainer = contentType({
  baseType: '_component',
  key: 'CMS54935CardContainer',
  displayName: 'CMS54935 Card Container',
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    heading: { type: 'string' },
    cards: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [CMS54935CommonCardContract],
      },
    },
  },
});

// ─── React Components ─────────────────────────────────────────────────────────

type CardComponentAProps = {
  content: ContentProps<typeof CMS54935CardComponentA>;
};

export function CMS54935CardComponentAComponent({ content }: CardComponentAProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <div
      style={{
        border: '2px solid #1976d2',
        borderRadius: '8px',
        padding: '1rem',
        background: '#e3f2fd',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#1976d2',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Card Component A
      </div>
      <h3 {...pa('cardTitle')} style={{ margin: '0 0 0.5rem' }}>
        {content.cardTitle ?? '(no title)'}
      </h3>
      <p {...pa('cardDescription')} style={{ margin: 0, color: '#555' }}>
        {content.cardDescription ?? '(no description)'}
      </p>
    </div>
  );
}

type CardComponentBProps = {
  content: ContentProps<typeof CMS54935CardComponentB>;
};

export function CMS54935CardComponentBComponent({ content }: CardComponentBProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <div
      style={{
        border: '2px solid #388e3c',
        borderRadius: '8px',
        padding: '1rem',
        background: '#e8f5e9',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#388e3c',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Card Component B
      </div>
      <h3 {...pa('cardTitle')} style={{ margin: '0 0 0.5rem' }}>
        {content.cardTitle ?? '(no title)'}
      </h3>
      <p {...pa('cardImage')} style={{ margin: 0, color: '#555' }}>
        {content.cardImage ? `Image: ${content.cardImage}` : '(no image)'}
      </p>
    </div>
  );
}

type CardContainerProps = {
  content: ContentProps<typeof CMS54935CardContainer>;
};

/**
 * Main test component for CMS-54935.
 *
 * QA checklist:
 * - With expandContracts:true (default in layout.tsx): each card item must
 *   render as CardComponentA or CardComponentB, with their own properties
 *   visible (cardTitle + cardDescription for A; cardTitle + cardImage for B).
 * - If the bug regresses, each item would only show __typename and _metadata
 *   (OptimizelyComponent would fall through to its default/unknown renderer).
 */
export default function CMS54935CardContainerComponent({ content }: CardContainerProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div
        style={{
          background: '#fff3e0',
          border: '1px solid #ffb300',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.85rem',
          color: '#e65100',
        }}
      >
        <strong>CMS-54935 test:</strong> array property with contract-based allowedTypes.
        Each card below must render its concrete type properties — not just metadata.
      </div>

      <h1 {...pa('heading')} style={{ marginBottom: '1.5rem' }}>
        {content.heading ?? 'CMS54935 Card Container'}
      </h1>

      <section>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#555' }}>
          Cards ({content.cards?.length ?? 0})
        </h2>
        <div {...pa('cards')} style={{ display: 'grid', gap: '1rem' }}>
          {content.cards && content.cards.length > 0 ? (
            content.cards.map((card, index) => (
              <OptimizelyComponent key={index} content={card} />
            ))
          ) : (
            <p style={{ color: '#9e9e9e', fontStyle: 'italic' }}>
              No cards yet — add CMS54935CardComponentA or CMS54935CardComponentB items.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
