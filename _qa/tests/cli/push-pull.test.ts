/**
 * CLI Smoke + Integration — opti-cms config push / pull
 *
 * Tests CLI commands against a real CMS site.
 * Requires .env with CMS credentials in the target template.
 *
 * Run:
 *   pnpm test:cli
 */

import { describe, test, expect } from 'vitest';
import { runCli, resolveProjectDir } from '../../helpers/cli-runner.js';

const TEMPLATE = process.env.CLI_TEST_TEMPLATE ?? 'stride';

const TEMPLATE_MAP: Record<string, string> = {
  stride: 'templates/stride',
  alloy: 'templates/alloy',
  'nextjs-template': 'samples/nextjs-template',
};

const projectDir = resolveProjectDir(TEMPLATE_MAP[TEMPLATE] ?? TEMPLATE);

describe(`CLI — ${TEMPLATE}`, () => {

  test('--version returns version string', () => {
    const result = runCli('--version', projectDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/\d+\.\d+\.\d+/);
  });

  test('--help shows usage', () => {
    const result = runCli('--help', projectDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('config');
  });

  test('config pull succeeds', () => {
    const result = runCli('config pull', projectDir);
    expect(result.exitCode, `CLI stderr: ${result.stderr}`).toBe(0);
    expect(result.stdout).toBeTruthy();
  });

  test('config push --dryRun succeeds', () => {
    const result = runCli('config push --dryRun', projectDir);
    expect(result.exitCode, `CLI stderr: ${result.stderr}`).toBe(0);
  });
});
