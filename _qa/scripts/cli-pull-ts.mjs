/**
 * Wrapper that patches process.stdout.isTTY so opti-cms pull generates
 * TypeScript files instead of falling back to JSON in non-interactive mode.
 *
 * Usage (from nextjs-template dir):
 *   node <this-script> config pull --single-file --output <dir>
 *   node <this-script> config pull --individual --output <dir>
 *   node <this-script> config pull --group --output <dir>
 *
 * Stdin is read for prompts — pipe "\n" to accept all defaults (no registry).
 */

import { pathToFileURL } from 'url';

const ttyMethods = {
  isTTY: true,
  getWindowSize: () => [120, 40],
  cursorTo: () => {},
  clearLine: () => {},
  moveCursor: () => {},
};
Object.assign(process.stdout, ttyMethods);
Object.assign(process.stderr, ttyMethods);

// Re-map argv so oclif sees: ["node", "opti-cms", ...args]
process.argv = ['node', 'opti-cms', ...process.argv.slice(2)];

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(__dirname, '../../samples/nextjs-template/node_modules/@optimizely/cms-cli/bin/run.js');
const cliEntry = pathToFileURL(cliPath).href;

await import(cliEntry);
