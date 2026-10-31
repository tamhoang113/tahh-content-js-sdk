import { contentType } from '@optimizely/cms-sdk';

export const AutoNoContent = contentType({
  key: 'AutoNoContent',
  displayName: 'Auto No Content (Push-Only Verify)',
  baseType: '_component',
  properties: {
    label: {
      type: 'string',
      displayName: 'Label',
    },
  },
});
