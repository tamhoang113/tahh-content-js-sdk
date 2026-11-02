import { contentType, type ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { SharedBaseContract } from './_shared-contract';

export const BlockStringProperty = contentType({
  key: 'BlockStringProperty',
  displayName: 'Block String Property',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled', 'sectionEnabled'],
  extends: [SharedBaseContract],
  properties: {
    simpleString: { type: 'string' },
    fullString: {
      type: 'string',
      displayName: 'Full String',
      description: 'A string property with every field set',
      isRequired: false,
      isLocalized: true,
      group: 'Content',
      sortOrder: 10,
      indexingType: 'searchable',
      displayMode: 'available',
      minLength: 1,
      maxLength: 500,
      pattern: '^[A-Za-z0-9 \\-_]+$',
    },
    enumString: {
      type: 'string',
      displayName: 'Enum String',
      enum: [
        { value: 'option_a', displayName: 'Option A' },
        { value: 'option_b', displayName: 'Option B' },
        { value: 'option_c', displayName: 'Option C' },
      ],
    },
    hiddenString: { type: 'string', displayMode: 'hidden' },
    queryableString: { type: 'string', indexingType: 'queryable' },
    noIndexString: { type: 'string', indexingType: 'disabled' },
  },
});

type Props = { content: ContentProps<typeof BlockStringProperty> };

export default function BlockStringPropertyComponent({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#7c5cbf', padding: '0.25rem 0.5rem', backgroundColor: '#e8e4f8', borderRadius: '4px', display: 'inline-block', marginBottom: '0.5rem' }}>
        {content.__typename ?? 'BlockStringProperty'}
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #e0e0e0', background: '#fff', color: '#1a1a1a' }}>
        <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '0.5rem', textAlign: 'left' }}>Property</th><th style={{ padding: '0.5rem', textAlign: 'left' }}>Value</th></tr></thead>
        <tbody>
          <tr data-property="contractField"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>contractField</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{content.contractField ?? '—'}</td></tr>
          <tr data-property="simpleString"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>simpleString</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('simpleString')}>{content.simpleString ?? '—'}</td></tr>
          <tr data-property="fullString"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>fullString</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('fullString')}>{content.fullString ?? '—'}</td></tr>
          <tr data-property="enumString"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>enumString</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }} {...pa('enumString')}>{content.enumString ?? '—'}</td></tr>
          <tr data-property="hiddenString"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>hiddenString</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{(content as any).hiddenString ?? '—'}</td></tr>
          <tr data-property="queryableString"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>queryableString</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{content.queryableString ?? '—'}</td></tr>
          <tr data-property="noIndexString"><td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>noIndexString</td><td data-col="value" style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{(content as any).noIndexString ?? '—'}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
