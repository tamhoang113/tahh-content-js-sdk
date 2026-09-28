import { buildConfig } from '@optimizely/cms-sdk';
import { existsSync, readFileSync } from 'node:fs';

const config = buildConfig({
  components: ['./src/components/**.tsx', './src/components/**.ts'],
  propertyGroups: [
    {
      key: 'seo',
      displayName: 'SEO',
      sortOrder: 1,
    },
    {
      key: 'meta',
      displayName: 'Meta',
      sortOrder: 2,
    },
    {
      key: 'layout',
      displayName: 'Layout',
      sortOrder: 3,
    },
  ],
  content: [
    {
      key: 'AboutExperienceContent',
      displayName: 'About Experience',
      contentType: 'AboutExperience',
      mayContainTypes: ['*'],
    },
    {
      key: 'BlogExperienceContent',
      displayName: 'Blog Experience',
      contentType: 'BlogExperience',
      mayContainTypes: ['*'],
    },
  ],
  applications: [
    {
      key: 'nextjs_app',
      entryPoint: 'AboutExperienceContent',
      displayName: 'Next.js Template',
      type: 'website',
      isDefault: true,
      useApplicationSpecificAssets: false,
      hosts: [
        {
          authority: 'localhost:3001',
          type: 'primary',
          preferredUrlScheme: 'https',
        },
      ],
      usePreviewTokens: true,
    },
    {
      key: 'blog_app',
      displayName: 'Blog App',
      type: 'website',
      isDefault: false,
      entryPoint: 'BlogExperienceContent',
      useApplicationSpecificAssets: false,
      hosts: [
        {
          authority: 'localhost:3002',
          type: 'primary',
          preferredUrlScheme: 'https',
        },
      ],
      usePreviewTokens: true,
    },
  ],
});

// ─── LOCAL QA FORK ONLY (do NOT push upstream) ──────────────────────────────
// Append fork-only extra globs (QA content types under src/qa/**) via a
// sidecar JSON file. This block sits AFTER the buildConfig({...}) literal so
// `git merge upstream/main` can freely refactor fields INSIDE that call
// without touching these lines — keeping the merge-conflict surface minimal.
// The sidecar file is fork-only; upstream doesn't ship it, so existsSync()
// naturally no-ops when this file is checked out cleanly from upstream.
const extrasUrl = new URL('./optimizely.qa-extras.json', import.meta.url);
if (existsSync(extrasUrl)) {
  const extras = JSON.parse(readFileSync(extrasUrl, 'utf8'));
  if (extras.components?.length) config.components.push(...extras.components);
}

// When QA automation pushes to CMS, we only want component/type definitions
// to reach the target — NOT the sample propertyGroups, experience content,
// or application host bindings (they would clobber whatever the target
// instance already has). This fork's sole purpose is QA automation, so we
// STRIP those fields BY DEFAULT — no env var needed for `opti-cms config push`,
// `npm test`, or any automation script.
//
// Opt-out (rare — only when you truly need to push the upstream sample data
// as-is, e.g. bootstrapping a brand-new demo instance):
//     $env:QA_PUSH_ALL="1"; npx @optimizely/cms-cli config push
if (process.env.QA_PUSH_ALL !== '1') {
  config.propertyGroups = [];
  config.content = [];
  config.applications = [];
}
// ────────────────────────────────────────────────────────────────────────────────

export default config;
