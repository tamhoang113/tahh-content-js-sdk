import { contentType } from '@optimizely/cms-sdk';

export const SkillTestingPageContentType = contentType({
  key: 'SkillTestingPage',
  displayName: 'Skill Testing Page',
  baseType: '_page',
  properties: {
    p_binary: {
      type: 'binary',
      format: 'blob',
      displayName: 'P Binary',
    },
  },
});
