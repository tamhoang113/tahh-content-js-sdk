/**
 * CMS-56727: CommonJS build of @optimizely/cms-sdk fails to load via require
 *
 * Root cause: package root has `"type": "module"`, so Node treats every .js
 * in the package — including dist/cjs/ — as ESM. When a consumer resolves
 * the `require` condition, require() of an ESM file fails with:
 *   "exports is not defined in ES module scope"
 *
 * Affected consumers: Jest (default CJS mode), ts-node, plain Node scripts,
 * Next.js/Jest config files (.js). ESM consumers (Next.js pages, Vite, Astro)
 * were NOT affected — they always resolved dist/esm/ directly.
 *
 * Fix (PR #592):
 *   - postbuild script writes dist/cjs/package.json {"type":"commonjs"},
 *     overriding package-level "type":"module" for that subdirectory
 *   - "main" corrected from ./dist/index.js (non-existent) → ./dist/cjs/index.js
 *   - exports map: types nested inside import/require conditions (nodenext)
 *
 * Run:
 *   pnpm test:sdk -- cms-56727
 *
 * To test against a specific installed version:
 *   CMS56727_SDK_ROOT="D:/path/to/node_modules/@optimizely/cms-sdk" pnpm test:sdk -- cms-56727
 */

import { describe, test, expect } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SDK_ROOT = process.env.CMS56727_SDK_ROOT
  ?? resolve(__dirname, '../../../packages/optimizely-cms-sdk');
const DIST_CJS = join(SDK_ROOT, 'dist', 'cjs');
const DIST_ESM = join(SDK_ROOT, 'dist', 'esm');

// Simulates CJS require() — exactly what Jest does internally when it runs
// a test file that uses `import { ... } from '@optimizely/cms-sdk'`
const requireCjs = createRequire(join(DIST_CJS, 'index.js'));

// ─── Scenario A: Jest test in a Next.js project ───────────────────────────────
//
// A developer writes a Jest test for their Next.js app:
//
//   import { createClient } from '@optimizely/cms-sdk'
//   test('client can be created', () => { ... })
//
// Jest in default CJS mode converts that `import` to require() internally.
// Before the fix: "exports is not defined in ES module scope" → suite crashes.

describe('Scenario A — Jest test file imports @optimizely/cms-sdk', () => {
  test('SDK loads when Jest require()s it (root entry point)', () => {
    const sdk = requireCjs(join(DIST_CJS, 'index.js'));
    expect(sdk).toBeTruthy();
  });

  test('named exports are accessible — developer can use the SDK in test', () => {
    const sdk = requireCjs(join(DIST_CJS, 'index.js'));
    expect(Object.keys(sdk).length).toBeGreaterThan(0);
  });

  test('core subpath loads — developer imports from @optimizely/cms-sdk/core', () => {
    const pkg = JSON.parse(readFileSync(join(SDK_ROOT, 'package.json'), 'utf-8'));
    const corePath = join(SDK_ROOT, pkg.exports['./core'].require.default);
    const core = requireCjs(corePath);
    expect(Object.keys(core).length).toBeGreaterThan(0);
  });
});

// ─── Scenario B: Plain Node.js seeding/migration script ──────────────────────
//
// A developer writes a Node.js utility script (no bundler, plain CJS):
//
//   const { createClient } = require('@optimizely/cms-sdk')
//
// Before the fix: crashes immediately on require().

describe('Scenario B — Plain Node.js script uses require()', () => {
  test('direct require of dist/cjs/index.js succeeds (exact repro from ticket)', () => {
    // The ticket repro command:
    //   node -e "require('./packages/optimizely-cms-sdk/dist/cjs/index.js')"
    // Before fix: "Cannot find module './model/index.js'"
    expect(() => requireCjs(join(DIST_CJS, 'index.js'))).not.toThrow();
  });

  test('schema subpath loads — developer uses @optimizely/cms-sdk/schema', () => {
    const pkg = JSON.parse(readFileSync(join(SDK_ROOT, 'package.json'), 'utf-8'));
    const schemaPath = join(SDK_ROOT, pkg.exports['./schema'].require.default);
    expect(() => requireCjs(schemaPath)).not.toThrow();
  });

  test('forms/validation subpath loads — developer validates form submissions', () => {
    const pkg = JSON.parse(readFileSync(join(SDK_ROOT, 'package.json'), 'utf-8'));
    const formsPath = join(SDK_ROOT, pkg.exports['./forms/validation'].require.default);
    expect(() => requireCjs(formsPath)).not.toThrow();
  });
});

// ─── Scenario C: All exported subpaths work ───────────────────────────────────
//
// A developer uses different entry points depending on what they need.
// Before the fix every require() subpath failed — none of them worked.

describe('Scenario C — Every require() subpath the developer might use', () => {
  const pkg = JSON.parse(readFileSync(join(SDK_ROOT, 'package.json'), 'utf-8'));

  const subpaths = Object.entries(pkg.exports as Record<string, any>)
    .filter(([, cond]) => cond?.require?.default)
    .map(([key, cond]) => ({
      subpath: key,
      absPath: join(SDK_ROOT, (cond as any).require.default),
    }));

  test.each(subpaths)(
    'require("@optimizely/cms-sdk$subpath") succeeds',
    ({ absPath }) => {
      expect(() => requireCjs(absPath)).not.toThrow();
    },
  );
});

// ─── Scenario D: TypeScript nodenext resolves types per-condition ─────────────
//
// A TypeScript project using moduleResolution: nodenext expects `types` to be
// nested inside each import/require condition — not as a flat sibling.
// Flat structure causes TS to always resolve the same .d.ts regardless of how
// the package was consumed (CJS vs ESM).
//
// This is the only scenario not provable by require() alone.

describe('Scenario D — TypeScript (moduleResolution: nodenext) resolves types', () => {
  const pkg = JSON.parse(readFileSync(join(SDK_ROOT, 'package.json'), 'utf-8'));
  const exports: Record<string, any> = pkg.exports;
  const dualExports = Object.keys(exports).filter((k) => exports[k]?.require?.default);

  test('no export has types as a flat sibling of import/require (old broken structure)', () => {
    for (const key of Object.keys(exports)) {
      expect(
        exports[key].types,
        `${key}: types must be nested inside import/require, not a sibling`,
      ).toBeUndefined();
    }
  });

  test.each(dualExports)(
    '%s — import.types and require.types are both present',
    (key) => {
      expect(exports[key].import?.types, `${key}.import.types`).toBeTruthy();
      expect(exports[key].require?.types, `${key}.require.types`).toBeTruthy();
    },
  );
});

// ─── Scenario E: ESM consumers unaffected (regression guard) ─────────────────
//
// Next.js pages, Vite, Astro use ESM imports and were NOT affected by the bug.
// Verify the fix didn't break them.

describe('Scenario E — Next.js pages / ESM consumers still work after fix', () => {
  test('dist/esm/index.js is a valid ES module (uses export, not module.exports)', () => {
    const content = readFileSync(join(DIST_ESM, 'index.js'), 'utf-8');
    expect(content).toMatch(/export/);
    expect(content).not.toMatch(/^module\.exports\s*=/m);
  });

  test('dynamic import of dist/esm resolves — ESM path unaffected', async () => {
    const sdk = await import(join(DIST_ESM, 'index.js'));
    expect(sdk).toBeTruthy();
  });
});
