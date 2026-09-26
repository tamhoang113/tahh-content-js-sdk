import { defineConfig, devices } from '@playwright/test';

const now = new Date();
const ts = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
function p(n: number) { return String(n).padStart(2, '0'); }

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: `test-results/e2e-${ts}`, open: 'never' }],
    ['junit', { outputFile: `test-results/e2e-${ts}.xml` }],
  ],
  use: {
    ignoreHTTPSErrors: true,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
});
