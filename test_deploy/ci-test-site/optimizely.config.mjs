import { buildConfig } from '@optimizely/cms-sdk';

export default buildConfig({
  components: [
    './components/*.tsx',
    './components/**/*.tsx',
    './components/contracts/*.ts',
  ],
  propertyGroups: [],
  locale: ['en'],
  content: [
    {
      key: 'home',
      displayName: 'Home',
      contentType: 'StartPage',
      locale: 'en',
    },
  ],
  applications: [
    {
      key: 'stride',
      entryPoint: 'home',
      displayName: 'Stride',
      type: 'website',
      isDefault: true,
      useApplicationSpecificAssets: false,
      hosts: [
        {
          authority: 'localhost:3000',
          type: 'primary',
          preferredUrlScheme: 'https',
        },
      ],
      usePreviewTokens: true,
    },
  ],
});
