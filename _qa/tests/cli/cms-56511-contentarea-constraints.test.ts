/**
 * CMS-56511 / CMS-54832: contentArea/contentReference constraint validation — negative tests
 *
 * CMS-56511: content property accepted `contentType` field, bypassing allowedTypes/restrictedTypes.
 * CMS-54832: contentReference type constraints edge cases (unconstrained, empty, invalid combos).
 *
 * After fix, validateContentAreaConstraints rejects:
 * - contentType on content properties (CMS-56511)
 * - contentType + allowedTypes combo on contentReference (CMS-54832)
 * - unconstrained content/contentReference (no constraints at all)
 * - empty allowedTypes arrays
 *
 * Positive cases (push + verify on CMS) are in push-property-types.test.ts.
 *
 * Run: pnpm test:cli -- cms-56511
 */

import { describe, test, expect } from 'vitest';
import { contentType } from '../../../packages/optimizely-cms-sdk/dist/cjs/index.js';
import { validateContentAreaConstraints } from '../../../packages/optimizely-cms-cli/dist/utils/mapping.js';

describe('CMS-56511 / CMS-54832 — validateContentAreaConstraints edge cases', () => {

  test('content property with contentType is rejected', () => {
    const types = [
      contentType({
        key: 'TestInvalidContentArea',
        baseType: '_page',
        displayName: 'Test',
        properties: {
          mainArea: { type: 'content', contentType: 'ImageElement' } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('mainArea');
    expect(errors[0]).toContain('unsupported type constraint');
  });

  test('array items of type content with contentType is rejected', () => {
    const types = [
      contentType({
        key: 'TestInvalidArrayContent',
        baseType: '_page',
        displayName: 'Test',
        properties: {
          sections: {
            type: 'array',
            items: { type: 'content', contentType: 'Banner' },
          } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('sections');
    expect(errors[0]).toContain('unsupported type constraint');
  });

  test('contentReference with both contentType AND allowedTypes is rejected (CMS-54832)', () => {
    const types = [
      contentType({
        key: 'TestInvalidComboRef',
        baseType: '_page',
        displayName: 'Test',
        properties: {
          invalidRef: {
            type: 'contentReference',
            contentType: 'Specialty',
            allowedTypes: ['_image'],
          } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('invalidRef');
  });

  test('unconstrained content property is rejected (no bypass possible)', () => {
    const types = [
      contentType({
        key: 'TestUnconstrainedContent',
        baseType: '_page',
        displayName: 'Test',
        properties: {
          mainArea: { type: 'content' } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('mainArea');
    expect(errors[0]).toContain('missing type constraints');
    expect(errors[0]).not.toContain('"contentType"');
  });

  test('unconstrained contentReference is rejected (CMS-54832)', () => {
    const types = [
      contentType({
        key: 'TestUnconstrainedRef',
        baseType: '_page',
        displayName: 'Test',
        properties: {
          myRef: { type: 'contentReference' } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('myRef');
    expect(errors[0]).toContain('missing type constraints');
  });

  test('empty allowedTypes on contentReference is rejected (CMS-54832)', () => {
    const types = [
      contentType({
        key: 'TestEmptyAllowedRef',
        baseType: '_page',
        displayName: 'Test',
        properties: {
          emptyRef: {
            type: 'contentReference',
            allowedTypes: [],
          } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('emptyRef');
    expect(errors[0]).toContain('empty type constraints');
  });

  test('empty allowedTypes on content (contentAreaItem) is rejected (CMS-54832)', () => {
    const types = [
      contentType({
        key: 'TestEmptyAllowedContent',
        baseType: '_page',
        displayName: 'Test',
        properties: {
          emptyContent: {
            type: 'content',
            allowedTypes: [],
          } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('emptyContent');
    expect(errors[0]).toContain('empty type constraints');
  });

  test('empty allowedTypes on contentArea items is rejected (CMS-54832)', () => {
    const types = [
      contentType({
        key: 'TestEmptyAllowedArea',
        baseType: '_page',
        displayName: 'Test',
        properties: {
          emptyArea: {
            type: 'array',
            items: { type: 'content', allowedTypes: [] },
          } as any,
        },
      }),
    ];

    const { errors } = validateContentAreaConstraints(types);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('emptyArea');
    expect(errors[0]).toContain('empty type constraints');
  });
});
