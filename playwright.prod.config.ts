import { defineConfig, devices } from '@playwright/test';

// Tests in e2e-prod/ run against the production build (`bun run build` first),
// served statically. The main suite (playwright.config.ts) uses the dev
// server, which is not prerendered: only here can a test see the static HTML
// React has to hydrate.
//
// E2E_PROD_PORT keeps parallel checkouts on one machine apart.
const PORT = Number(process.env.E2E_PROD_PORT) || 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e-prod',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun scripts/serve-build.ts',
    env: { PORT: String(PORT) },
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
