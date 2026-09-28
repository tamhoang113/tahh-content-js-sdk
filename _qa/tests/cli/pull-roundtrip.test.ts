/**
 * CLI Pull — Round-trip & Build verification
 *
 * Flow:
 *   1. Push content types (Auto* prefix) via opti-cms config push
 *   2. Pull back via --json and verify key fields match what was pushed
 *   3. Pull as TypeScript files in all 3 modes (single-file / individual / group)
 *   4. Run tsc --noEmit on each pulled output to verify compilation
 *
 * Extra fields returned by pull (e.g. allowedTypes: [], isRequired: false) are ignored —
 * only the fields we explicitly set during push are verified.
 *
 * Options:
 *   KEEP_PULL_OUTPUT=1  — keep generated TS files in test-results/pull/ after tests
 *
 * Run:
 *   pnpm test:cli -- pull-roundtrip
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
const config: SiteConfig = loadSiteConfig('nextjs-template');
const projectDir = resolveProjectDir('samples/nextjs-template');

const KEEP_OUTPUT = process.env.KEEP_PULL_OUTPUT === '1';
const pullBaseDir = path.resolve(__dirname, '../../test-results/pull');

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

/** Parse pull --json output (strips spinner lines before the JSON block) */
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

/** Run tsc --noEmit in a directory. Returns {ok, output}. */
function tscCheck(dir: string): { ok: boolean; output: string } {
  const tsconfigPath = path.join(dir, 'tsconfig.json');
  const templateNodeModules = path.resolve(projectDir, 'node_modules');
  // paths must be relative to baseUrl and point to the exact .d.ts file
  // (pointing to the package directory doesn't resolve with bundler moduleResolution)
  const sdkDts = path.join(templateNodeModules, '@optimizely/cms-sdk/dist/cjs/index.d.ts');
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

// ─── Part 1: round-trip data verification (--json) ───────────────────────────

describe('pull --json round-trip', () => {
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

  test('AutoBaseContract exists and is a contract', () => {
    const ct = getType(manifest, 'AutoBaseContract');
    expect(ct, 'AutoBaseContract not found').toBeTruthy();
    expect(ct.isContract).toBe(true);
    expect(getProp(ct, 'contractField')?.type).toBe('string');
  });

  test('AutoStringAllFields — key metadata', () => {
    const ct = getType(manifest, 'AutoStringAllFields');
    expect(ct, 'AutoStringAllFields not found').toBeTruthy();
    expect(ct.baseType).toBe('_component');
    expect(ct.contracts).toContain('AutoBaseContract');
  });

  test('AutoStringAllFields — fullString field values preserved', () => {
    const ct = getType(manifest, 'AutoStringAllFields');
    const prop = getProp(ct, 'fullString');
    expect(prop, 'fullString not found').toBeTruthy();
    expect(prop.type).toBe('string');
    expect(prop.displayName).toBe('Full String');
    expect(prop.isRequired).toBe(true);
    expect(prop.isLocalized).toBe(true);
    expect(prop.group).toBe('Content');
    expect(prop.sortOrder).toBe(10);
    expect(prop.indexingType).toBe('searchable');
    expect(prop.minLength).toBe(1);
    expect(prop.maxLength).toBe(500);
    expect(prop.pattern).toBe('^[A-Za-z0-9 ]+$');
  });

  test('AutoStringAllFields — simpleString only has type set (rest are defaults)', () => {
    const ct = getType(manifest, 'AutoStringAllFields');
    const prop = getProp(ct, 'simpleString');
    expect(prop, 'simpleString not found').toBeTruthy();
    expect(prop.type).toBe('string');
    // Extra fields from pull (defaults) should not fail the round-trip
    // isLocalized: false, isRequired: false, sortOrder: 0 are all acceptable defaults
  });

  test('AutoStringAllFields — hiddenString preserves displayMode', () => {
    const ct = getType(manifest, 'AutoStringAllFields');
    const prop = getProp(ct, 'hiddenString');
    expect(prop?.displayMode).toBe('hidden');
  });

  test('AutoBooleanAllFields — boolean property round-trip', () => {
    const ct = getType(manifest, 'AutoBooleanAllFields');
    expect(ct, 'AutoBooleanAllFields not found').toBeTruthy();
    expect(getProp(ct, 'simpleBool')?.type).toBe('boolean');
    const full = getProp(ct, 'fullBool');
    expect(full?.isRequired).toBe(true);
    expect(full?.isLocalized).toBe(true);
  });

  test('AutoIntegerAllFields — integer constraints preserved', () => {
    const ct = getType(manifest, 'AutoIntegerAllFields');
    const prop = getProp(ct, 'fullInt');
    expect(prop?.type).toBe('integer');
    expect(prop?.minimum).toBeDefined();
    expect(prop?.maximum).toBeDefined();
  });

  test('AutoContentRefAllFields — allowedTypes preserved', () => {
    const ct = getType(manifest, 'AutoContentRefAllFields');
    const prop = getProp(ct, 'simpleRef');
    expect(prop?.type).toBe('contentReference');
    expect(Array.isArray(prop?.allowedTypes)).toBe(true);
    expect(prop?.allowedTypes.length).toBeGreaterThan(0);
  });

  // ── Array item-level validation ─────────────────────────────────────────────

  test('AutoArrayItemValidation — string items preserve minLength/maxLength/pattern', () => {
    const ct = getType(manifest, 'AutoArrayItemValidation');
    expect(ct, 'AutoArrayItemValidation not found').toBeTruthy();
    const prop = getProp(ct, 'stringArrayWithValidation');
    expect(prop?.type).toBe('array');
    expect(prop?.items?.type).toBe('string');
    expect(prop?.items?.minLength).toBe(2);
    expect(prop?.items?.maxLength).toBe(50);
    expect(prop?.items?.pattern).toBe('^[a-z]+$');
    expect(prop?.minItems).toBe(1);
    expect(prop?.maxItems).toBe(5);
  });

  test('AutoArrayItemValidation — integer items preserve minimum/maximum', () => {
    const ct = getType(manifest, 'AutoArrayItemValidation');
    const prop = getProp(ct, 'intArrayWithValidation');
    expect(prop?.type).toBe('array');
    expect(prop?.items?.type).toBe('integer');
    expect(prop?.items?.minimum).toBe(1);
    expect(prop?.items?.maximum).toBe(100);
  });

  test('AutoArrayItemValidation — float items preserve minimum/maximum', () => {
    const ct = getType(manifest, 'AutoArrayItemValidation');
    const prop = getProp(ct, 'floatArrayWithValidation');
    expect(prop?.type).toBe('array');
    expect(prop?.items?.type).toBe('float');
    expect(prop?.items?.minimum).toBe(0);
    expect(prop?.items?.maximum).toBe(10);
  });

  test('AutoArrayItemValidation — contentReference items preserve allowedTypes', () => {
    const ct = getType(manifest, 'AutoArrayItemValidation');
    const prop = getProp(ct, 'contentRefArray');
    expect(prop?.type).toBe('array');
    expect(prop?.items?.type).toBe('contentReference');
    expect(Array.isArray(prop?.items?.allowedTypes)).toBe(true);
    expect(prop?.items?.allowedTypes).toContain('_image');
  });

  test('AutoArrayItemValidation — content items preserve allowedTypes', () => {
    const ct = getType(manifest, 'AutoArrayItemValidation');
    const prop = getProp(ct, 'contentArray');
    expect(prop?.type).toBe('array');
    expect(prop?.items?.type).toBe('content');
    expect(Array.isArray(prop?.items?.allowedTypes)).toBe(true);
    expect(prop?.items?.allowedTypes).toContain('_page');
  });

  // ── baseType variants ────────────────────────────────────────────────────────

  test('AutoPageBaseType — baseType _page preserved', () => {
    const ct = getType(manifest, 'AutoPageBaseType');
    expect(ct, 'AutoPageBaseType not found').toBeTruthy();
    expect(ct.baseType).toBe('_page');
    expect(getProp(ct, 'title')?.type).toBe('string');
    expect(getProp(ct, 'title')?.isRequired).toBe(true);
  });

  test('AutoExperienceBaseType — baseType _experience preserved', () => {
    const ct = getType(manifest, 'AutoExperienceBaseType');
    expect(ct, 'AutoExperienceBaseType not found').toBeTruthy();
    expect(ct.baseType).toBe('_experience');
    expect(getProp(ct, 'title')?.type).toBe('string');
  });

  test('AutoSectionBaseType — baseType _section preserved', () => {
    const ct = getType(manifest, 'AutoSectionBaseType');
    expect(ct, 'AutoSectionBaseType not found').toBeTruthy();
    expect(ct.baseType).toBe('_section');
  });

  test('AutoFolderBaseType — baseType _folder and mayContainTypes preserved', () => {
    const ct = getType(manifest, 'AutoFolderBaseType');
    expect(ct, 'AutoFolderBaseType not found').toBeTruthy();
    expect(ct.baseType).toBe('_folder');
    expect(Array.isArray(ct.mayContainTypes)).toBe(true);
    // CMS resolves the '_self' shorthand to the actual content type key on pull
    expect(ct.mayContainTypes).toContain('AutoFolderBaseType');
  });

  // ── compositionBehaviors ─────────────────────────────────────────────────────

  test('AutoComponentElementEnabled — compositionBehaviors elementEnabled preserved', () => {
    const ct = getType(manifest, 'AutoComponentElementEnabled');
    expect(ct, 'AutoComponentElementEnabled not found').toBeTruthy();
    expect(ct.baseType).toBe('_component');
    expect(Array.isArray(ct.compositionBehaviors)).toBe(true);
    expect(ct.compositionBehaviors).toContain('elementEnabled');
  });

  test('AutoComponentSectionEnabled — compositionBehaviors sectionEnabled preserved', () => {
    const ct = getType(manifest, 'AutoComponentSectionEnabled');
    expect(ct, 'AutoComponentSectionEnabled not found').toBeTruthy();
    expect(ct.compositionBehaviors).toContain('sectionEnabled');
  });

  test('AutoComponentBothBehaviors — both compositionBehaviors preserved', () => {
    const ct = getType(manifest, 'AutoComponentBothBehaviors');
    expect(ct, 'AutoComponentBothBehaviors not found').toBeTruthy();
    expect(ct.compositionBehaviors).toContain('elementEnabled');
    expect(ct.compositionBehaviors).toContain('sectionEnabled');
  });
});

// ─── Part 2: TypeScript build check for each pull mode ───────────────────────

const PULL_MODES: PullMode[] = ['single-file', 'individual', 'group'];

describe.each(PULL_MODES)('pull --%s → tsc --noEmit', (mode) => {
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
