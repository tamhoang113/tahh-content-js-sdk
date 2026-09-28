#!/usr/bin/env node
/**
 * Generate standalone HTML report from vitest JSON output.
 * Usage: node scripts/generate-report.mjs <suite-name>
 *   suite-name: "cli" | "sdk" | any label
 * Reads: test-results/.vitest-results.json
 * Writes: test-results/<suite>-<YYYYMMDD-HHmmss>.html
 */

import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const resultsDir = join(root, 'test-results');
const jsonPath = join(resultsDir, '.vitest-results.json');

const suite = process.argv[2] || 'test';

let data;
try {
  data = JSON.parse(readFileSync(jsonPath, 'utf8'));
} catch {
  console.error(`Cannot read ${jsonPath}. Did the tests run with json reporter?`);
  process.exit(1);
}

const now = new Date();
const ts = [
  now.getFullYear(),
  p(now.getMonth() + 1), p(now.getDate()),
  '-',
  p(now.getHours()), p(now.getMinutes()), p(now.getSeconds()),
].join('');

function p(n) { return String(n).padStart(2, '0'); }

const passed = data.numPassedTests ?? 0;
const failed = data.numFailedTests ?? 0;
const skipped = (data.numPendingTests ?? 0) + (data.numTodoTests ?? 0);
const total = passed + failed + skipped;
const duration = ((data.testResults ?? []).reduce((s, f) => s + (f.endTime - f.startTime), 0) / 1000).toFixed(1);
const status = failed > 0 ? 'FAILED' : 'PASSED';
const statusColor = failed > 0 ? '#e74c3c' : '#27ae60';

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let testRows = '';
for (const file of (data.testResults ?? [])) {
  const fileName = file.name?.replace(/\\/g, '/').split('tests/').pop() ?? file.name;
  for (const suite of (file.assertionResults ?? [])) {
    const icon = suite.status === 'passed' ? '&#9989;'
      : suite.status === 'failed' ? '&#10060;'
      : '&#9898;';
    const rowClass = suite.status === 'failed' ? 'failed' : suite.status === 'passed' ? 'passed' : 'skipped';
    const ancestors = (suite.ancestorTitles ?? []).join(' > ');
    const fullTitle = ancestors ? `${ancestors} > ${suite.title}` : suite.title;
    const dur = suite.duration != null ? `${(suite.duration / 1000).toFixed(2)}s` : '-';
    let errorHtml = '';
    if (suite.failureMessages?.length) {
      const msg = suite.failureMessages.map(m => escHtml(m)).join('\n\n');
      errorHtml = `<details><summary>Error details</summary><pre class="error">${msg}</pre></details>`;
    }
    testRows += `<tr class="${rowClass}">
      <td>${icon}</td>
      <td class="name">${escHtml(fullTitle)}</td>
      <td>${escHtml(fileName)}</td>
      <td>${dur}</td>
    </tr>${errorHtml ? `<tr class="${rowClass}"><td colspan="4">${errorHtml}</td></tr>` : ''}`;
  }
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escHtml(suite.toUpperCase())} Test Report - ${ts}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 2rem; }
  .header { background: ${statusColor}; color: white; padding: 1.5rem 2rem; border-radius: 8px; margin-bottom: 1.5rem; }
  .header h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .header .meta { opacity: 0.9; font-size: 0.9rem; }
  .summary { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .card { background: white; border-radius: 8px; padding: 1rem 1.5rem; flex: 1; min-width: 120px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
  .card .number { font-size: 2rem; font-weight: 700; }
  .card .label { font-size: 0.8rem; text-transform: uppercase; color: #888; margin-top: 0.25rem; }
  .card.pass .number { color: #27ae60; }
  .card.fail .number { color: #e74c3c; }
  .card.skip .number { color: #f39c12; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  th { background: #2c3e50; color: white; padding: 0.75rem 1rem; text-align: left; font-size: 0.85rem; text-transform: uppercase; }
  td { padding: 0.6rem 1rem; border-bottom: 1px solid #eee; font-size: 0.9rem; }
  tr.passed td { background: #f0fdf4; }
  tr.failed td { background: #fef2f2; }
  tr.skipped td { background: #fffbeb; }
  .name { max-width: 500px; word-break: break-word; }
  pre.error { background: #1e1e1e; color: #f8f8f2; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.8rem; margin: 0.5rem 0; white-space: pre-wrap; }
  details summary { cursor: pointer; color: #e74c3c; font-weight: 600; font-size: 0.85rem; }
</style>
</head>
<body>
<div class="header">
  <h1>${escHtml(suite.toUpperCase())} Tests &mdash; ${status}</h1>
  <div class="meta">Generated: ${now.toLocaleString()} &bull; Duration: ${duration}s</div>
</div>
<div class="summary">
  <div class="card"><div class="number">${total}</div><div class="label">Total</div></div>
  <div class="card pass"><div class="number">${passed}</div><div class="label">Passed</div></div>
  <div class="card fail"><div class="number">${failed}</div><div class="label">Failed</div></div>
  <div class="card skip"><div class="number">${skipped}</div><div class="label">Skipped</div></div>
</div>
<table>
  <thead><tr><th></th><th>Test</th><th>File</th><th>Duration</th></tr></thead>
  <tbody>${testRows}</tbody>
</table>
</body>
</html>`;

mkdirSync(resultsDir, { recursive: true });
const outPath = join(resultsDir, `${suite}-${ts}.html`);
writeFileSync(outPath, html, 'utf8');

try { unlinkSync(jsonPath); } catch {}

console.log(`Report: ${outPath}`);
