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
    headless: false,
    ignoreHTTPSErrors: true,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            // Okta's bot-detection watches for navigator.webdriver (exposed by default
            // automated Chromium) and delays/blocks interactive elements (e.g. the
            // "Next" button on the login form never becomes actionable). This flag
            // disables that specific automation signal for CMS login flows.
            '--disable-blink-features=AutomationControlled',
            // Chrome 136+ shows a native "Local Network Access" permission prompt
            // ("<origin> wants to: Access other apps and services on this device")
            // when a public-origin page (the CMS edit UI) embeds an iframe pointing
            // at a private/local address (the sitePreview iframe -> localhost:3001).
            // A fresh Playwright browser context has no granted permissions and no
            // one to click "Allow", so the iframe hangs at about:blank forever.
            // Both the old (PrivateNetworkAccess*) and the new (LocalNetworkAccess*)
            // feature flag families are disabled here — depending on Chrome build,
            // one or the other family is what's actually gating the prompt.
            '--disable-features=LocalNetworkAccessChecks,LocalNetworkAccessPermission,LocalNetworkAccessPromptForV2,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults,PrivateNetworkAccessPermissionPrompt,BlockInsecurePrivateNetworkRequests,BlockInsecurePrivateNetworkRequestsFromPrivate,BlockInsecurePrivateNetworkRequestsForNavigations',
          ],
        },
      },
    },
  ],
});
