import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Run an opti-cms CLI command in a given project directory.
 *
 * @param command - CLI subcommand (e.g. "config push", "config pull --single-file")
 * @param projectDir - Absolute path to the project (template/sample) directory
 * @param timeoutMs - Max execution time (default 60s)
 */
export function runCli(
  command: string,
  projectDir: string,
  timeoutMs = 60_000,
): CliResult {
  const fullCmd = `npx @optimizely/cms-cli ${command}`;
  try {
    const stdout = execSync(fullCmd, {
      cwd: projectDir,
      timeout: timeoutMs,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err: any) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message,
    };
  }
}

/**
 * Resolve a template/sample directory relative to the monorepo root.
 */
export function resolveProjectDir(relativePath: string): string {
  const monorepoRoot = path.resolve(__dirname, '..', '..');
  return path.join(monorepoRoot, relativePath);
}
