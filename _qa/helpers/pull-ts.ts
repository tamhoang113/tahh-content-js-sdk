/**
 * Helper to run `opti-cms config pull` in TypeScript-generation mode
 * (--single-file / --individual / --group) from a non-interactive process.
 *
 * The CLI detects `process.stdout.isTTY` to choose between JSON and TS output.
 * We use a wrapper script (scripts/cli-pull-ts.mjs) that patches the TTY flags
 * before importing the CLI entry point, then pipes "\n" to answer the registry
 * prompt with the default (No).
 */

import { execFileSync, execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WRAPPER = path.resolve(__dirname, '../scripts/cli-pull-ts.mjs');

export type PullMode = 'single-file' | 'individual' | 'group';

export interface PullTsResult {
  success: boolean;
  stdout: string;
  stderr: string;
  outDir: string;
}

/**
 * Pull content types as TypeScript files into outDir.
 *
 * @param projectDir  - Directory with .env and optimizely.config.mjs
 * @param outDir      - Directory to write generated TS files into
 * @param mode        - Output organization: 'single-file' | 'individual' | 'group'
 * @param timeoutMs   - Max execution time (default 90s)
 */
export function pullTs(
  projectDir: string,
  outDir: string,
  mode: PullMode,
  timeoutMs = 90_000,
): PullTsResult {
  mkdirSync(outDir, { recursive: true });
  try {
    const stdout = execFileSync(
      'node',
      [WRAPPER, 'config', 'pull', `--${mode}`, '--output', outDir],
      {
        cwd: projectDir,
        timeout: timeoutMs,
        encoding: 'utf-8',
        // Pipe "\n" to stdin so the "generate registry?" prompt accepts default (No)
        input: '\n',
      },
    );
    return { success: true, stdout, stderr: '', outDir };
  } catch (err: any) {
    return {
      success: false,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message,
      outDir,
    };
  }
}

/**
 * Remove a pull output directory (use in afterAll when KEEP_PULL_OUTPUT is not set).
 */
export function cleanPullOutput(outDir: string) {
  if (!existsSync(outDir)) return;
  try {
    rmSync(outDir, { recursive: true, force: true });
  } catch {
    // Windows may deny rmSync if VS Code or another process holds a handle.
    // Fall back to cmd.exe rmdir which is less strict about open handles.
    try {
      execSync(`rmdir /s /q "${outDir}"`, { shell: 'cmd.exe', stdio: 'ignore' });
    } catch {
      // Best-effort — leave the directory; .gitignore covers test-results/
    }
  }
}
