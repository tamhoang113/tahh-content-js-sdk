import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';

// ─── Section content type ────────────────────────────────────────────────────

/**
 * CMS-54844: Section with custom properties.
 * Bug: custom properties were only at content.component.<prop> in section components.
 * Fix: OptimizelyComposition now spreads component into content, so content.heading works directly.
 * QA: verify content.heading and content.subtitle render correctly (not undefined).
 */
export const CMS54844HeroSection = contentType({
  baseType: '_section',
  key: 'CMS54844HeroSection',
  displayName: 'CMS54844 Hero Section',
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    heading: { type: 'string' },
    subtitle: { type: 'string' },
  },
});

// ─── Element inside the section ──────────────────────────────────────────────

export const CMS54844HeroElement = contentType({
  baseType: '_component',
  key: 'CMS54844HeroElement',
  displayName: 'CMS54844 Hero Element',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    text: { type: 'string' },
  },
});

// ─── React Components ─────────────────────────────────────────────────────────

type HeroSectionProps = {
  content: ContentProps<typeof CMS54844HeroSection>;
};

export default function CMS54844HeroSectionComponent({ content }: HeroSectionProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <section
      style={{
        border: '2px solid #7b1fa2',
        borderRadius: '10px',
        padding: '1.5rem',
        //background: '#f3e5f5',
        maxWidth: '900px',
        margin: '0 auto 1.5rem',
      }}
    >
      <p {...pa('heading')} style={{ fontFamily: 'monospace', margin: '0 0 0.5rem' }}>
        <strong>HeroSection Content.heading:</strong> {content.heading ?? '(undefined)'}
      </p>
      <p {...pa('subtitle')} style={{ fontFamily: 'monospace', margin: '0 0 1rem' }}>
        <strong>HeroSection Content.subtitle:</strong> {content.subtitle ?? '(undefined)'}
      </p>

      <OptimizelyGridSection nodes={content.nodes} />
    </section>
  );
}

type HeroElementProps = {
  content: ContentProps<typeof CMS54844HeroElement>;
};

export function CMS54844HeroElementComponent({ content }: HeroElementProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <div
      style={{
        border: '1px solid #ce93d8',
        borderRadius: '6px',
        padding: '0.75rem 1rem',
        //background: '#fce4ec',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#ad1457',
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}
      >
        CMS54844HeroElement · _component
      </div>
      <p {...pa('text')} style={{ margin: 0 }}>
        {content.text ?? '(no text)'}
      </p>
    </div>
  );
}
