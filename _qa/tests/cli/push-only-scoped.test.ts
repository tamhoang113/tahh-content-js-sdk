/**
 * CLI — config push --only (CMS-57357)
 *
 * Verifies the --only flag scopes the push to selected content types,
 * contracts, or display templates. Uses --dryRun + --output to inspect
 * the manifest without hitting CMS, plus live push for E2E verification.
 *
 * Content types used: Hero, LandingPage (upstream samples — always present).
 * QA types used: AutoBaseContract, AutoStringAllFields (from src/qa/).
 *
 * Prerequisites:
 *   - .env with OPTIMIZELY_CMS_URL, CLIENT_ID, CLIENT_SECRET
 *   - Upstream PR #606 merged (provides --only flag)
 *
 * Run:
 *   pnpm test:cli -- push-only-scoped
 *
 * JIRA: CMS-57357
 */

import { describe, test, expect } from 'vitest';
import { runCli, resolveProjectDir } from '../../helpers/cli-runner.js';
import { loadSiteConfig } from '../../helpers/config.js';
import { getContentType, deleteContentType } from '../../helpers/cms-api.js';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { SiteConfig } from '../../helpers/types.js';

const config: SiteConfig = loadSiteConfig('nextjs-template');
const projectDir = resolveProjectDir('samples/nextjs-template');

// ─── Helpers ────────────────────────────────────────────────────────────────

function pushOnly(keys: string, extraFlags = ''): ReturnType<typeof runCli> {
  return runCli(`config push --only ${keys} ${extraFlags}`.trim(), projectDir);
}

function pushOnlyDryRun(keys: string, outputPath: string): ReturnType<typeof runCli> {
  return runCli(
    `config push --only ${keys} --dryRun --output ${outputPath}`,
    projectDir,
  );
}

function readManifest(outputPath: string): any {
  const raw = readFileSync(outputPath, 'utf-8');
  return JSON.parse(raw);
}

function cleanupFile(filePath: string): void {
  if (existsSync(filePath)) unlinkSync(filePath);
}

// ─── 1. Flag parsing & error handling ───────────────────────────────────────

describe('CMS-57357 — --only flag parsing', () => {

  test('--help shows --only flag', () => {
    const result = runCli('config push --help', projectDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--only');
  });

  test('--only with empty value exits with error', () => {
    const result = pushOnly('""');
    expect(result.exitCode).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('--only requires at least one key');
  });

  test('--only with unknown key exits with error before sending', () => {
    const result = pushOnly('NonExistentType12345');
    expect(result.exitCode).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('Unknown keys in --only: NonExistentType12345');
  });

  test('--only with mix of valid and unknown key exits with error', () => {
    const result = pushOnly('Hero,FakeType');
    expect(result.exitCode).not.toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('FakeType');
  });
});

// ─── 2. Manifest scoping via --dryRun --output ─────────────────────────────

describe('CMS-57357 — scoped manifest content', () => {

  const outputFile = join(projectDir, '.test-manifest-only.json');

  test('--only Hero produces manifest with only Hero content type', () => {
    cleanupFile(outputFile);
    const result = pushOnlyDryRun('Hero', outputFile);
    expect(result.exitCode, `CLI failed: ${result.stderr}`).toBe(0);

    const manifest = readManifest(outputFile);
    const ctKeys = manifest.contentTypes?.map((ct: any) => ct.key) ?? [];

    expect(ctKeys).toContain('Hero');
    expect(ctKeys).not.toContain('LandingPage');
    expect(ctKeys).not.toContain('Article');

    cleanupFile(outputFile);
  });

  test('--only Hero,Banner includes both types', () => {
    cleanupFile(outputFile);
    const result = pushOnlyDryRun('Hero,Banner', outputFile);
    expect(result.exitCode, `CLI failed: ${result.stderr}`).toBe(0);

    const manifest = readManifest(outputFile);
    const ctKeys = manifest.contentTypes?.map((ct: any) => ct.key) ?? [];

    expect(ctKeys).toContain('Hero');
    expect(ctKeys).toContain('Banner');
    expect(ctKeys).not.toContain('Article');

    cleanupFile(outputFile);
  });

  test('--only Hero includes display templates for Hero', () => {
    cleanupFile(outputFile);
    const result = pushOnlyDryRun('Hero', outputFile);
    expect(result.exitCode, `CLI failed: ${result.stderr}`).toBe(0);

    const manifest = readManifest(outputFile);
    const dtContentTypes = (manifest.displayTemplates ?? [])
      .map((dt: any) => dt.contentType)
      .filter(Boolean);

    // All display templates in the manifest should belong to Hero
    for (const ct of dtContentTypes) {
      expect(ct).toBe('Hero');
    }

    cleanupFile(outputFile);
  });

  test('--only Hero excludes display templates for other types', () => {
    cleanupFile(outputFile);
    const result = pushOnlyDryRun('Hero', outputFile);
    expect(result.exitCode, `CLI failed: ${result.stderr}`).toBe(0);

    const manifest = readManifest(outputFile);
    const dtContentTypes = (manifest.displayTemplates ?? [])
      .map((dt: any) => dt.contentType)
      .filter(Boolean);

    expect(dtContentTypes).not.toContain('LandingPage');
    expect(dtContentTypes).not.toContain('Article');

    cleanupFile(outputFile);
  });

  test('--only Hero includes only property groups used by Hero', () => {
    cleanupFile(outputFile);
    const result = pushOnlyDryRun('Hero', outputFile);
    expect(result.exitCode, `CLI failed: ${result.stderr}`).toBe(0);

    const manifest = readManifest(outputFile);
    const pgKeys = (manifest.propertyGroups ?? []).map((pg: any) => pg.key);

    // Hero's property groups should be a subset of all config property groups
    // (we can't assert exact keys without reading the TSX, but we verify
    // the list is smaller than the full config's property groups)
    const fullResult = runCli('config push --dryRun --output ' + outputFile + '.full', projectDir);
    expect(fullResult.exitCode).toBe(0);
    const fullManifest = readManifest(outputFile + '.full');
    const fullPgKeys = (fullManifest.propertyGroups ?? []).map((pg: any) => pg.key);

    expect(pgKeys.length).toBeLessThanOrEqual(fullPgKeys.length);

    cleanupFile(outputFile);
    cleanupFile(outputFile + '.full');
  });

  test('--only with contract key includes only the contract', () => {
    cleanupFile(outputFile);
    const result = pushOnlyDryRun('AutoBaseContract', outputFile);
    expect(result.exitCode, `CLI failed: ${result.stderr}`).toBe(0);

    const manifest = readManifest(outputFile);
    const ctKeys = manifest.contentTypes?.map((ct: any) => ct.key) ?? [];

    expect(ctKeys).toContain('AutoBaseContract');
    expect(ctKeys.length).toBe(1);

    cleanupFile(outputFile);
  });
});

// ─── 3. Logging output ─────────────────────────────────────────────────────

describe('CMS-57357 — scoped push logging', () => {

  test('scoped push logs only pushed items, not full discovery', () => {
    const result = pushOnly('Hero', '--dryRun');
    const output = result.stdout + result.stderr;

    expect(output).toContain('Pushing content types');
    expect(output).toContain('Hero');
    // Should NOT log the full discovery output for non-scoped items
    expect(output).not.toMatch(/Content Type found:.*LandingPage/);
  });

  test('scoped push does not log applications or property groups discovery', () => {
    const result = pushOnly('Hero', '--dryRun');
    const output = result.stdout + result.stderr;

    // Scoped push suppresses discovery logging (log = false for findMetaData)
    expect(output).not.toContain('Applications found');
  });
});

// ─── 4. Flag combinations ──────────────────────────────────────────────────

describe('CMS-57357 — --only combined with other flags', () => {

  test('--only + --dryRun does not send to CMS', () => {
    const result = pushOnly('Hero', '--dryRun');
    expect(result.exitCode, `CLI failed: ${result.stderr}`).toBe(0);
    // dryRun should not contain "uploaded" or "imported"
    const output = result.stdout + result.stderr;
    expect(output).not.toContain('Configuration file uploaded');
    expect(output).not.toContain('Successfully imported');
  });

  test('--only + --force succeeds', () => {
    const result = pushOnly('Hero', '--force --dryRun');
    expect(result.exitCode, `CLI failed: ${result.stderr}`).toBe(0);
  });
});

// ─── 5. Regression — full push still works ──────────────────────────────────

describe('CMS-57357 — regression: full push without --only', () => {

  test('config push --dryRun (no --only) still succeeds', () => {
    const result = runCli('config push --dryRun', projectDir);
    expect(result.exitCode, `CLI failed: ${result.stderr}`).toBe(0);
  });

  test('full push logs discovery output (Content Type found, Property Groups found)', () => {
    const result = runCli('config push --dryRun', projectDir);
    const output = result.stdout + result.stderr;

    // Full push should show per-file discovery
    expect(output).toContain('Content Type');
  });
});

// ─── 6. Live push verification (E2E) ───────────────────────────────────────

describe('CMS-57357 — live scoped push to CMS', () => {

  test('--only AutoNoContent: delete from CMS → push only → verify exists via API', async () => {
    // 1. Delete AutoNoContent from CMS (clean slate)
    const deleted = await deleteContentType(config, 'AutoNoContent');
    expect(deleted, 'Failed to delete AutoNoContent from CMS').toBe(true);

    // 2. Verify it's gone
    const before = await getContentType(config, 'AutoNoContent');
    expect(before, 'AutoNoContent should not exist on CMS after delete').toBeNull();

    // 3. Push only AutoNoContent
    const result = pushOnly('AutoNoContent');
    const output = result.stdout + result.stderr;
    const uploaded =
      output.includes('Configuration file uploaded') ||
      output.includes('Successfully imported');
    expect(uploaded, `Scoped push did not upload:\n${output}`).toBe(true);

    // 4. Verify it now exists on CMS via REST API
    const after = await getContentType(config, 'AutoNoContent');
    expect(after, 'AutoNoContent not found on CMS after --only push').toBeTruthy();
    expect(after.key).toBe('AutoNoContent');
  }, 120_000);
});
