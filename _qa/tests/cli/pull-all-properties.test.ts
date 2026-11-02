/**
 * CLI Pull — Round-trip verification for all_properties/ content types
 *
 * Flow:
 *   1. Push content types (Page/Block/Exp + array variants) via opti-cms config push
 *   2. Pull back via --json and verify key fields match what was pushed
 *   3. Pull as TypeScript files in all 3 modes (single-file / individual / group)
 *   4. Run tsc --noEmit on each pulled output to verify compilation
 *
 * Content type source: qa-app/src/components/all_properties/
 *
 * Options:
 *   KEEP_PULL_OUTPUT=1  — keep generated TS files in test-results/pull/ after tests
 *
 * Run:
 *   pnpm test:cli -- pull-all-properties
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, readdirSync, existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { runCli, resolveProjectDir } from '../../helpers/cli-runner.js';
import { loadSiteConfig } from '../../helpers/config.js';
import { pullTs, cleanPullOutput } from '../../helpers/pull-ts.js';
import type { PullMode } from '../../helpers/pull-ts.js';
import type { SiteConfig } from '../../helpers/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config: SiteConfig = loadSiteConfig('qa-app');
const projectDir = resolveProjectDir('qa-app');

const KEEP_OUTPUT = process.env.KEEP_PULL_OUTPUT === '1';
const pullBaseDir = path.resolve(__dirname, '../../test-results/pull-all-properties');

// ─── Setup: push once ────────────────────────────────────────────────────────

beforeAll(() => {
  const result = runCli('config push', projectDir);
  const output = result.stdout + result.stderr;
  const uploaded =
    output.includes('Configuration file uploaded') ||
    output.includes('Successfully imported');
  expect(uploaded, `Push failed:\n${output}`).toBe(true);
}, 120_000);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePullJson(raw: string): any {
  const jsonStart = raw.indexOf('{');
  if (jsonStart === -1) throw new Error('No JSON found in pull output');
  return JSON.parse(raw.slice(jsonStart));
}

function getType(manifest: any, key: string): any {
  return manifest.contentTypes?.find((ct: any) => ct.key === key) ?? null;
}

function getProp(ct: any, key: string): any {
  return ct?.properties?.[key] ?? null;
}

function tscCheck(dir: string): { ok: boolean; output: string } {
  const tsconfigPath = path.join(dir, 'tsconfig.json');
  const qaAppNodeModules = path.resolve(projectDir, 'node_modules');
  const sdkDts = path.join(qaAppNodeModules, '@optimizely/cms-sdk/dist/cjs/index.d.ts');
  const sdkRelPath = path.relative(dir, sdkDts).replace(/\\/g, '/');

  require('fs').writeFileSync(
    tsconfigPath,
    JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        baseUrl: '.',
        paths: { '@optimizely/cms-sdk': [sdkRelPath] },
      },
      include: ['**/*.ts'],
      exclude: ['node_modules', 'tsconfig.json'],
    }),
  );

  try {
    const output = execSync(`npx tsc --project ${tsconfigPath}`, {
      cwd: dir,
      encoding: 'utf-8',
      timeout: 60_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, output };
  } catch (err: any) {
    return { ok: false, output: err.stdout + '\n' + err.stderr };
  }
}

// ─── Part 1: round-trip data verification (--json) ──────────────────────────

describe('pull --json round-trip (all_properties)', () => {
  let manifest: any;

  beforeAll(() => {
    const result = runCli('config pull --json', projectDir);
    expect(result.exitCode, `pull --json failed:\n${result.stderr}`).toBe(0);
    manifest = parsePullJson(result.stdout + result.stderr);
  }, 60_000);

  test('manifest contains contentTypes array', () => {
    expect(Array.isArray(manifest.contentTypes)).toBe(true);
    expect(manifest.contentTypes.length).toBeGreaterThan(0);
  });

  // ── Contract ──────────────────────────────────────────────────────────────

  test('SharedBaseContract exists and is a contract', () => {
    const ct = getType(manifest, 'SharedBaseContract');
    expect(ct, 'SharedBaseContract not found').toBeTruthy();
    expect(ct.isContract).toBe(true);
    expect(getProp(ct, 'contractField')?.type).toBe('string');
  });

  // ── Page string — full field verification ─────────────────────────────────

  test('PageStringProperty — key metadata', () => {
    const ct = getType(manifest, 'PageStringProperty');
    expect(ct, 'PageStringProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_page');
    expect(ct.contracts).toContain('SharedBaseContract');
  });

  test('PageStringProperty — fullString field values preserved', () => {
    const ct = getType(manifest, 'PageStringProperty');
    const prop = getProp(ct, 'fullString');
    expect(prop, 'fullString not found').toBeTruthy();
    expect(prop.type).toBe('string');
    expect(prop.displayName).toBe('Full String');
    expect(prop.isRequired).toBe(false);
    expect(prop.isLocalized).toBe(true);
    expect(prop.group).toBe('Content');
    expect(prop.sortOrder).toBe(10);
    expect(prop.indexingType).toBe('searchable');
    expect(prop.minLength).toBe(1);
    expect(prop.maxLength).toBe(500);
    expect(prop.pattern).toBe('^[A-Za-z0-9 \\-_]+$');
  });

  test('PageStringProperty — simpleString only has type', () => {
    const ct = getType(manifest, 'PageStringProperty');
    const prop = getProp(ct, 'simpleString');
    expect(prop, 'simpleString not found').toBeTruthy();
    expect(prop.type).toBe('string');
  });

  test('PageStringProperty — hiddenString preserves displayMode', () => {
    const ct = getType(manifest, 'PageStringProperty');
    const prop = getProp(ct, 'hiddenString');
    expect(prop?.displayMode).toBe('hidden');
  });

  // ── Block string — baseType + compositionBehaviors ────────────────────────

  test('BlockStringProperty — baseType _component with compositionBehaviors', () => {
    const ct = getType(manifest, 'BlockStringProperty');
    expect(ct, 'BlockStringProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_component');
    expect(Array.isArray(ct.compositionBehaviors)).toBe(true);
    expect(ct.compositionBehaviors).toContain('elementEnabled');
    expect(ct.compositionBehaviors).toContain('sectionEnabled');
  });

  test('BlockStringProperty — fullString field preserved', () => {
    const ct = getType(manifest, 'BlockStringProperty');
    const prop = getProp(ct, 'fullString');
    expect(prop, 'fullString not found').toBeTruthy();
    expect(prop.type).toBe('string');
    expect(prop.displayName).toBe('Full String');
    expect(prop.isRequired).toBe(false);
  });

  // ── Experience string — baseType ──────────────────────────────────────────

  test('ExpStringProperty — baseType _experience', () => {
    const ct = getType(manifest, 'ExpStringProperty');
    expect(ct, 'ExpStringProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_experience');
    expect(getProp(ct, 'simpleString')?.type).toBe('string');
  });

  // ── Boolean ───────────────────────────────────────────────────────────────

  test('PageBooleanProperty — boolean property round-trip', () => {
    const ct = getType(manifest, 'PageBooleanProperty');
    expect(ct, 'PageBooleanProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_page');
    expect(getProp(ct, 'simpleBool')?.type).toBe('boolean');
    const full = getProp(ct, 'fullBool');
    expect(full?.isRequired).toBe(false);
    expect(full?.isLocalized).toBe(true);
  });

  test('BlockBooleanProperty — baseType _component', () => {
    const ct = getType(manifest, 'BlockBooleanProperty');
    expect(ct, 'BlockBooleanProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_component');
    expect(getProp(ct, 'simpleBool')?.type).toBe('boolean');
  });

  // ── Integer ───────────────────────────────────────────────────────────────

  test('PageIntegerProperty — integer constraints preserved', () => {
    const ct = getType(manifest, 'PageIntegerProperty');
    expect(ct, 'PageIntegerProperty not found').toBeTruthy();
    const prop = getProp(ct, 'fullInt');
    expect(prop?.type).toBe('integer');
    expect(prop?.minimum).toBeDefined();
    expect(prop?.maximum).toBeDefined();
  });

  // ── Float ─────────────────────────────────────────────────────────────────

  test('PageFloatProperty — float constraints preserved', () => {
    const ct = getType(manifest, 'PageFloatProperty');
    expect(ct, 'PageFloatProperty not found').toBeTruthy();
    const prop = getProp(ct, 'fullFloat');
    expect(prop?.type).toBe('float');
    expect(prop?.minimum).toBeDefined();
    expect(prop?.maximum).toBeDefined();
  });

  // ── DateTime ──────────────────────────────────────────────────────────────

  test('PageDateTimeProperty — dateTime min/max preserved', () => {
    const ct = getType(manifest, 'PageDateTimeProperty');
    expect(ct, 'PageDateTimeProperty not found').toBeTruthy();
    const prop = getProp(ct, 'fullDateTime');
    expect(prop?.type).toBe('dateTime');
    expect(prop?.minimum).toBeTruthy();
    expect(prop?.maximum).toBeTruthy();
    expect(prop.minimum).toContain('2020');
    expect(prop.maximum).toContain('2030');
  });

  test('BlockDateTimeProperty — baseType _component with compositionBehaviors', () => {
    const ct = getType(manifest, 'BlockDateTimeProperty');
    expect(ct, 'BlockDateTimeProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_component');
    expect(ct.compositionBehaviors).toContain('elementEnabled');
  });

  // ── RichText ──────────────────────────────────────────────────────────────

  test('PageRichTextProperty — richText presets preserved', () => {
    const ct = getType(manifest, 'PageRichTextProperty');
    expect(ct, 'PageRichTextProperty not found').toBeTruthy();
    const full = getProp(ct, 'fullRichText');
    expect(full?.type).toBe('richText');
    expect(full?.indexingType).toMatch(/searchable/i);
    const preset = full?.editorSettings?.preset ?? full?.preset;
    expect(preset).toMatch(/expanded/i);

    const minimal = getProp(ct, 'minimalRichText');
    const minPreset = minimal?.editorSettings?.preset ?? minimal?.preset;
    expect(minPreset).toMatch(/minimal/i);
  });

  // ── Url ───────────────────────────────────────────────────────────────────

  test('PageUrlProperty — url round-trip', () => {
    const ct = getType(manifest, 'PageUrlProperty');
    expect(ct, 'PageUrlProperty not found').toBeTruthy();
    expect(getProp(ct, 'simpleUrl')?.type).toBe('url');
    expect(getProp(ct, 'fullUrl')?.displayName).toBe('Full Url');
  });

  // ── Link ──────────────────────────────────────────────────────────────────

  test('PageLinkProperty — link round-trip', () => {
    const ct = getType(manifest, 'PageLinkProperty');
    expect(ct, 'PageLinkProperty not found').toBeTruthy();
    expect(getProp(ct, 'simpleLink')?.type).toBe('link');
    expect(getProp(ct, 'fullLink')?.displayName).toBe('Full Link');
  });

  // ── Json ──────────────────────────────────────────────────────────────────

  test('PageJsonProperty — json round-trip', () => {
    const ct = getType(manifest, 'PageJsonProperty');
    expect(ct, 'PageJsonProperty not found').toBeTruthy();
    expect(getProp(ct, 'simpleJson')?.type).toBe('json');
    expect(getProp(ct, 'fullJson')?.displayName).toBe('Full Json');
  });

  // ── ContentReference ──────────────────────────────────────────────────────

  test('PageContentRefProperty — allowedTypes preserved', () => {
    const ct = getType(manifest, 'PageContentRefProperty');
    expect(ct, 'PageContentRefProperty not found').toBeTruthy();
    const prop = getProp(ct, 'simpleRef');
    expect(prop?.type).toBe('contentReference');
    expect(Array.isArray(prop?.allowedTypes)).toBe(true);
    expect(prop.allowedTypes.length).toBeGreaterThan(0);

    const full = getProp(ct, 'fullRef');
    expect(full?.allowedTypes).toContain('_page');
    expect(full?.allowedTypes).toContain('_image');
  });

  // ── ContentArea ───────────────────────────────────────────────────────────

  test('PageContentAreaProperty — array of content items', () => {
    const ct = getType(manifest, 'PageContentAreaProperty');
    expect(ct, 'PageContentAreaProperty not found').toBeTruthy();
    const prop = getProp(ct, 'simpleContentArea');
    expect(prop?.type).toBe('array');
    expect(prop?.items?.type).toBe('content');

    const allowed = getProp(ct, 'contentAreaWithAllowed');
    expect(allowed?.items?.allowedTypes).toContain('_page');
    expect(allowed?.items?.allowedTypes).toContain('_component');
    expect(allowed?.maxItems).toBe(20);

    const restricted = getProp(ct, 'contentAreaWithRestricted');
    expect(restricted?.items?.restrictedTypes).toContain('_folder');
    expect(restricted?.items?.restrictedTypes).toContain('_media');
  });

  // ── ContentItem ───────────────────────────────────────────────────────────

  test('PageContentItemProperty — content item with allowedTypes', () => {
    const ct = getType(manifest, 'PageContentItemProperty');
    expect(ct, 'PageContentItemProperty not found').toBeTruthy();
    expect(getProp(ct, 'simpleContent')?.type).toBe('content');
    expect(getProp(ct, 'fullContent')?.allowedTypes).toContain('_page');
    expect(getProp(ct, 'contentWithRestricted')?.restrictedTypes).toContain('_folder');
  });

  // ── Component property ────────────────────────────────────────────────────

  test('PageComponentProperty — component property round-trip', () => {
    const ct = getType(manifest, 'PageComponentProperty');
    expect(ct, 'PageComponentProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_page');
    expect(getProp(ct, 'simpleComponent')?.type).toBe('component');
    expect(getProp(ct, 'fullComponent')?.displayName).toBe('Full Component');
  });

  test('BlockComponentProperty — baseType _component', () => {
    const ct = getType(manifest, 'BlockComponentProperty');
    expect(ct, 'BlockComponentProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_component');
    expect(getProp(ct, 'simpleComponent')?.type).toBe('component');
  });

  test('ExpComponentProperty — baseType _experience', () => {
    const ct = getType(manifest, 'ExpComponentProperty');
    expect(ct, 'ExpComponentProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_experience');
    expect(getProp(ct, 'simpleComponent')?.type).toBe('component');
  });

  // ── Section ───────────────────────────────────────────────────────────────

  test('SectionMixedProperty — baseType _section with mixed properties', () => {
    const ct = getType(manifest, 'SectionMixedProperty');
    expect(ct, 'SectionMixedProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_section');
    expect(getProp(ct, 'pString')?.type).toBe('string');
    expect(getProp(ct, 'pRichText')?.type).toBe('richText');
    expect(getProp(ct, 'pContentReference')?.type).toBe('contentReference');
  });

  // ── Array property types ──────────────────────────────────────────────────

  test('PageArrayStringProperty — array of strings round-trip', () => {
    const ct = getType(manifest, 'PageArrayStringProperty');
    expect(ct, 'PageArrayStringProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_page');
    const simple = getProp(ct, 'simpleArray');
    expect(simple?.type).toBe('array');
    expect(simple?.items?.type).toBe('string');
    const full = getProp(ct, 'fullArray');
    expect(full?.minItems).toBe(1);
    expect(full?.maxItems).toBe(10);
  });

  test('BlockArrayStringProperty — array of strings on _component', () => {
    const ct = getType(manifest, 'BlockArrayStringProperty');
    expect(ct, 'BlockArrayStringProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_component');
    expect(ct.compositionBehaviors).toContain('elementEnabled');
    expect(getProp(ct, 'simpleArray')?.items?.type).toBe('string');
  });

  test('PageArrayRichTextProperty — array of richText round-trip', () => {
    const ct = getType(manifest, 'PageArrayRichTextProperty');
    expect(ct, 'PageArrayRichTextProperty not found').toBeTruthy();
    expect(getProp(ct, 'simpleArray')?.items?.type).toBe('richText');
  });

  test('PageArrayIntegerProperty — array of integers round-trip', () => {
    const ct = getType(manifest, 'PageArrayIntegerProperty');
    expect(ct, 'PageArrayIntegerProperty not found').toBeTruthy();
    expect(getProp(ct, 'simpleArray')?.items?.type).toBe('integer');
  });

  test('PageArrayContentRefProperty — array of contentReference round-trip', () => {
    const ct = getType(manifest, 'PageArrayContentRefProperty');
    expect(ct, 'PageArrayContentRefProperty not found').toBeTruthy();
    const prop = getProp(ct, 'fullArray');
    expect(prop?.items?.type).toBe('contentReference');
    expect(prop?.items?.allowedTypes).toContain('_page');
    expect(prop?.items?.allowedTypes).toContain('_image');
  });

  test('PageArrayContentProperty — array of content round-trip', () => {
    const ct = getType(manifest, 'PageArrayContentProperty');
    expect(ct, 'PageArrayContentProperty not found').toBeTruthy();
    const prop = getProp(ct, 'fullArray');
    expect(prop?.items?.type).toBe('content');
    expect(prop?.items?.allowedTypes).toContain('_page');
    expect(prop?.items?.allowedTypes).toContain('_component');
  });

  test('ExpArrayStringProperty — array on _experience', () => {
    const ct = getType(manifest, 'ExpArrayStringProperty');
    expect(ct, 'ExpArrayStringProperty not found').toBeTruthy();
    expect(ct.baseType).toBe('_experience');
    expect(getProp(ct, 'simpleArray')?.items?.type).toBe('string');
  });
});

// ─── Part 2: TypeScript build check for each pull mode ─────────────────────

const PULL_MODES: PullMode[] = ['single-file', 'individual', 'group'];

describe.each(PULL_MODES)('pull --%s → tsc --noEmit (all_properties)', (mode) => {
  const outDir = path.join(pullBaseDir, mode);
  let pullResult: ReturnType<typeof pullTs>;

  beforeAll(() => {
    mkdirSync(outDir, { recursive: true });
    pullResult = pullTs(projectDir, outDir, mode, 90_000);
  }, 100_000);

  afterAll(() => {
    if (!KEEP_OUTPUT) cleanPullOutput(outDir);
  });

  test(`pull --${mode} exits successfully`, () => {
    expect(
      pullResult.success,
      `pull --${mode} failed:\n${pullResult.stderr}`,
    ).toBe(true);
  });

  test(`pull --${mode} generates TypeScript files`, () => {
    expect(existsSync(outDir)).toBe(true);
    const files = getAllTsFiles(outDir);
    expect(files.length, `No .ts files found in ${outDir}`).toBeGreaterThan(0);
  });

  test(`pull --${mode} TypeScript compiles without errors`, () => {
    const { ok, output } = tscCheck(outDir);
    expect(ok, `tsc failed for --${mode}:\n${output}`).toBe(true);
  });
});

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...getAllTsFiles(fullPath));
    else if (entry.name.endsWith('.ts') && entry.name !== 'tsconfig.json') files.push(fullPath);
  }
  return files;
}
