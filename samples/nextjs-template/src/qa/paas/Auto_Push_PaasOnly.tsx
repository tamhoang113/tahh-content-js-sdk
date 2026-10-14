import { contentType } from '@optimizely/cms-sdk';

// ─── PaaS-only content types for CLI Push verification ───────────────────────
// These types use property types not supported on SaaS (e.g. binary).
// Included in push only when OPTIMIZELY_PLATFORM=paas.

/**
 * binary property (PaaS only — SaaS API does not support binary)
 */
export const AutoBinaryAllFields = contentType({
  key: 'AutoBinaryAllFields',
  displayName: 'Auto Binary All Fields',
  baseType: '_component',
  properties: {
    simpleBinary: {
      type: 'string',
      format: 'blob',
    },

    fullBinary: {
      type: 'string',
      format: 'blob',
      displayName: 'Full Binary',
      description: 'A binary with every field set',
      isRequired: true,
      isLocalized: false,
      group: 'Content',
      sortOrder: 100,
      displayMode: 'available',
    },

    hiddenBinary: {
      type: 'string',
      format: 'blob',
      displayMode: 'hidden',
    },
  },
});
