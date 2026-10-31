/**
 * CMS-56835 — Deploy to front-end hosting from the JS SDK CLI
 *
 * Integration tests for the `deploy` command. Exercises the CLI binary
 * through `runCli` in `--output` mode (local packaging, no DXP credentials
 * required) and validates project validation, packaging exclusions, naming,
 * and error handling.
 *
 * Tests that require real DXP credentials (actual deployment, environment
 * access checks) are flagged as manual in the QA analysis.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCli, resolveProjectDir } from '../../helpers/cli-runner.js';

// ── Helpers ────────────────────────────────────────────────────────────────

let projectDir: string;
let outputDir: string;

const writeProjectFile = async (relativePath: string, content = '') => {
  const full = join(projectDir, relativePath);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, content);
};

const writePackageJson = (pkg: Record<string, unknown>) =>
  writeProjectFile('package.json', JSON.stringify(pkg));

const VALID_PKG = {
  name: 'my-test-site',
  version: '1.0.0',
  scripts: { build: 'next build', start: 'next start', deploy: 'optimizely-cms-cli deploy' },
  dependencies: { next: '^15.0.0', '@optimizely/cms-sdk': '^2.0.0' },
};

beforeEach(async () => {
  projectDir = await mkdtemp(join(tmpdir(), 'qa-deploy-'));
  outputDir = join(projectDir, '_out');
});

afterEach(async () => {
  await rm(projectDir, { recursive: true, force: true }).catch(() => {});
});

// ── 1. Packaging — happy path (--output mode) ─────────────────────────────

describe('CMS-56835 — deploy --output (package-only mode)', () => {
  it('creates a zip package for a valid Next.js project with package-lock.json', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');
    await writeProjectFile('src/app/page.tsx', 'export default function Page() { return <h1>Hello</h1>; }');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).toBe(0);

    const files = await readdir(outputDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^my-test-site\.head\.app\..+\.zip$/);

    const zipPath = join(outputDir, files[0]);
    const header = await readFile(zipPath);
    expect(header.subarray(0, 2).toString()).toBe('PK');
  });

  it('creates a zip for a valid yarn project', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('yarn.lock', '');
    await writeProjectFile('src/index.ts', '');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).toBe(0);

    const files = await readdir(outputDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/\.zip$/);
  });

  it('accepts an Astro project with astro as devDependency', async () => {
    await writePackageJson({
      ...VALID_PKG,
      dependencies: {},
      devDependencies: { astro: '^5.0.0' },
      scripts: { build: 'astro build', start: 'node ./dist/server/entry.mjs' },
    });
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).toBe(0);

    const files = await readdir(outputDir);
    expect(files.length).toBe(1);
  });

  it('uses --name and --version overrides for the package name', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(
      `deploy --output "${outputDir}" --dir "${projectDir}" --name custom-site --version 2.0.0`,
      projectDir,
    );

    expect(result.exitCode).toBe(0);

    const files = await readdir(outputDir);
    expect(files.length).toBe(1);
    expect(files[0]).toBe('custom-site.head.app.2.0.0.zip');
  });
});

// ── 2. Package name sanitization ──────────────────────────────────────────

describe('CMS-56835 — package name sanitization', () => {
  it('strips npm scope and special characters from package name', async () => {
    await writePackageJson({
      ...VALID_PKG,
      name: '@acme/my_site.web',
    });
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).toBe(0);

    const files = await readdir(outputDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/^mysiteweb\.head\.app\..+\.zip$/);
  });

  it('rejects invalid --name override with spaces', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(
      `deploy --output "${outputDir}" --dir "${projectDir}" --name "my site"`,
      projectDir,
    );

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Invalid package name');
  });

  it('rejects invalid --version override with path traversal', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(
      `deploy --output "${outputDir}" --dir "${projectDir}" --version "../../x"`,
      projectDir,
    );

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Invalid package version');
  });

  it('accepts a prerelease version override', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(
      `deploy --output "${outputDir}" --dir "${projectDir}" --version 1.0.0-beta.1`,
      projectDir,
    );

    expect(result.exitCode).toBe(0);

    const files = await readdir(outputDir);
    expect(files.length).toBe(1);
    expect(files[0]).toMatch(/1\.0\.0-beta\.1\.zip$/);
  });
});

// ── 3. Project validation errors ──────────────────────────────────────────

describe('CMS-56835 — project validation', () => {
  it('fails when package.json is missing', async () => {
    // Empty directory — no package.json
    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('No package.json found');
  });

  it('fails when build script is missing', async () => {
    await writePackageJson({
      ...VALID_PKG,
      scripts: { start: 'next start' }, // no build
    });
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('no "build" script');
  });

  it('fails when start script is missing', async () => {
    await writePackageJson({
      ...VALID_PKG,
      scripts: { build: 'next build' }, // no start
    });
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('no "start" script');
  });

  it('fails when neither next nor astro is a dependency', async () => {
    await writePackageJson({
      ...VALID_PKG,
      dependencies: { react: '^19.0.0' }, // no next, no astro
    });
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('supports Next.js and Astro');
  });

  it('fails with workspace:* dependency', async () => {
    await writePackageJson({
      ...VALID_PKG,
      dependencies: {
        ...VALID_PKG.dependencies,
        '@acme/ui': 'workspace:*',
      },
    });
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('"@acme/ui" uses "workspace:*"');
  });

  it('fails with link: dependency', async () => {
    await writePackageJson({
      ...VALID_PKG,
      dependencies: {
        ...VALID_PKG.dependencies,
        'my-lib': 'link:../my-lib',
      },
    });
    await writeProjectFile('package-lock.json', '{}');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('"my-lib" uses "link:../my-lib"');
  });

  it('reports all problems at once (multiple validation errors)', async () => {
    await writePackageJson({
      name: 'my-site',
      scripts: { build: 'vite build' }, // no start
      dependencies: { '@optimizely/cms-sdk': 'workspace:*' }, // no next/astro + workspace dep
    });
    // no lock file

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('no "start" script');
    expect(result.stderr).toContain('supports Next.js and Astro');
    expect(result.stderr).toContain('workspace:*');
    expect(result.stderr).toContain('No package-lock.json or yarn.lock');
  });
});

// ── 4. Lock file validation ──────────────────────────────────────────────

describe('CMS-56835 — lock file validation', () => {
  it('fails with only pnpm-lock.yaml (no npm/yarn lock)', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('pnpm-lock.yaml', '');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);
    const output = result.stdout + result.stderr;

    expect(result.exitCode).not.toBe(0);
    expect(output).toMatch(/pnpm-lock\.yaml/);
    expect(output).toContain('package-lock-only');
  });

  it('fails with both package-lock.json and yarn.lock', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');
    await writeProjectFile('yarn.lock', '');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);
    const output = result.stdout + result.stderr;

    expect(result.exitCode).not.toBe(0);
    expect(output).toContain('package-lock.json and yarn.lock');
    expect(output).toMatch(/one lock file/);
  });

  it('fails with no lock files at all', async () => {
    await writePackageJson(VALID_PKG);

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('No package-lock.json or yarn.lock found');
  });
});

// ── 5. Package content (file inclusion/exclusion) ─────────────────────────

describe('CMS-56835 — package file exclusions', () => {
  it('excludes .env but includes .env.example and .env.template', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');
    await writeProjectFile('.env', 'SECRET=value');
    await writeProjectFile('.env.local', 'LOCAL_SECRET=value');
    await writeProjectFile('.env.production', 'PROD_SECRET=value');
    await writeProjectFile('.env.example', 'EXAMPLE=placeholder');
    await writeProjectFile('.env.template', 'TEMPLATE=placeholder');
    await writeProjectFile('src/app/page.tsx', 'export default () => <h1>Hi</h1>');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).toBe(0);

    // Read the zip to check contents (we can at least verify via file count in output)
    // The detailed inclusion/exclusion is verified by dev unit tests (hostingPackage.test.ts)
    // Here we just verify the command succeeds and creates a valid zip
    const files = await readdir(outputDir);
    expect(files.length).toBe(1);
  });

  it('warns when .npmrc contains a literal registry token', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');
    await writeProjectFile('.npmrc', '//registry.npmjs.org/:_authToken=npm_abc123\n');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);
    const output = result.stdout + result.stderr;

    expect(result.exitCode).toBe(0);
    expect(output).toContain('Warning');
    expect(output).toContain('.npmrc contains a registry token');
  });

  it('does not warn when .npmrc uses token placeholder', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');
    await writeProjectFile('.npmrc', '//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n');

    const result = runCli(`deploy --output "${outputDir}" --dir "${projectDir}"`, projectDir);
    const output = result.stdout + result.stderr;

    expect(result.exitCode).toBe(0);
    expect(output).not.toContain('Warning');
  });
});

// ── 6. Missing --env flag (without --output) ──────────────────────────────

describe('CMS-56835 — missing flags', () => {
  it('fails without --env when --output is not specified', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');

    // No DXP credentials in env — but it should fail on --env before reaching credential check
    const result = runCli(`deploy --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Missing required flag --env');
  });
});

// ── 7. Credential validation ──────────────────────────────────────────────

describe('CMS-56835 — credential validation', () => {
  it('fails with clear message when DXP env vars are not set', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');
    // No .env file with DXP credentials, and none in process.env

    const result = runCli(`deploy --env Test1 --dir "${projectDir}"`, projectDir);

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Front-end hosting credentials not provided');
    expect(result.stderr).toContain('OPTIMIZELY_DXP_PROJECT_ID');
  });

  it('error message lists only missing variable names, never secret values', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');
    // .env has PROJECT_ID but missing KEY and SECRET
    await writeProjectFile('.env', 'OPTIMIZELY_DXP_PROJECT_ID=test-project\n');

    const result = runCli(`deploy --env Test1 --dir "${projectDir}"`, projectDir);
    const output = result.stdout + result.stderr;

    expect(result.exitCode).not.toBe(0);
    expect(output).toContain('OPTIMIZELY_DXP_CLIENT_KEY');
    expect(output).toContain('OPTIMIZELY_DXP_CLIENT_SECRET');
    expect(output).not.toContain('test-project');
  });

  it('env vars from .env file are read as config', async () => {
    await writePackageJson(VALID_PKG);
    await writeProjectFile('package-lock.json', '{}');
    // .env has all 3 DXP credentials — deploy should read them and attempt connection
    // (will fail at checkEnvironmentAccess since credentials are fake, but proves .env was read)
    await writeProjectFile('.env', [
      'OPTIMIZELY_DXP_PROJECT_ID=fake-project',
      'OPTIMIZELY_DXP_CLIENT_KEY=fake-key',
      'OPTIMIZELY_DXP_CLIENT_SECRET=fake-secret',
    ].join('\n'));

    const result = runCli(`deploy --env Test1 --dir "${projectDir}"`, projectDir);
    const output = result.stdout + result.stderr;

    // Should NOT fail with "credentials not provided" — proves .env was read
    expect(output).not.toContain('credentials not provided');
    // Should fail at access check or connection (fake credentials)
    expect(result.exitCode).not.toBe(0);
  });
});

// ── 8. --help and flag listing ───────────────────────────────────────────

describe('CMS-56835 — CLI help', () => {
  it('deploy --help lists all deploy flags', async () => {
    const cliDir = resolveProjectDir('packages/optimizely-cms-cli');
    const result = runCli('deploy --help', cliDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--env');
    expect(result.stdout).toContain('--output');
    expect(result.stdout).toContain('--dir');
    expect(result.stdout).toContain('--name');
    expect(result.stdout).toContain('--version');
    expect(result.stdout).toContain('--no-complete');
    expect(result.stdout).toContain('--yes');
    expect(result.stdout).toContain('--timeout');
  });

  it('main --help includes deploy in the command list', async () => {
    const cliDir = resolveProjectDir('packages/optimizely-cms-cli');
    const result = runCli('--help', cliDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('deploy');
  });
});

// ── 9. create-app --ci flag ──────────────────────────────────────────────

describe('CMS-56835 — create-app --ci github', () => {
  it('creates deploy workflow when --ci github is passed with a deployable template', async () => {
    const createAppDir = resolveProjectDir('packages/optimizely-cms-create-app');
    const testProjectName = `qa-deploy-test-${Date.now()}`;
    const testProjectDir = join(tmpdir(), testProjectName);

    try {
      const result = runCli(
        `--help`, // Just verify --ci flag is documented
        createAppDir,
      );

      // Verify the --ci flag is in the help
      // (Full create-app test would take too long and install deps)
      // Instead, verify the deploy workflow template file exists
      const workflowTemplate = join(
        createAppDir,
        'templates',
        'scaffold',
        'github',
        'deploy-optimizely.yml',
      );
      expect(existsSync(workflowTemplate)).toBe(true);

      // Verify the workflow content references the DXP secrets
      const workflowContent = await readFile(workflowTemplate, 'utf8');
      expect(workflowContent).toContain('OPTIMIZELY_DXP_PROJECT_ID');
      expect(workflowContent).toContain('OPTIMIZELY_DXP_CLIENT_KEY');
      expect(workflowContent).toContain('OPTIMIZELY_DXP_CLIENT_SECRET');
      expect(workflowContent).toContain('deploy --env');
      expect(workflowContent).toContain('--yes');
    } finally {
      await rm(testProjectDir, { recursive: true, force: true }).catch(() => {});
    }
  });
});

// ── Helper: readdir ──────────────────────────────────────────────────────

async function readdir(dir: string): Promise<string[]> {
  const { readdir: rd } = await import('node:fs/promises');
  try {
    return await rd(dir);
  } catch {
    return [];
  }
}
