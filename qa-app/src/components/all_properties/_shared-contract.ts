import { contract } from '@optimizely/cms-sdk';

export const SharedBaseContract = contract({
  key: 'SharedBaseContract',
  displayName: 'Shared Base Contract',
  properties: {
    contractField: { type: 'string', displayName: 'Contract Field' },
  },
});
