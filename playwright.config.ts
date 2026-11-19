import { defineConfig, devices } from '@playwright/test';

// Parallel worktrees each run their own dev server: set E2E_PORT to a port
// nobody else uses, or the tests silently reuse another checkout's server.
// strictPort makes a collision fail loudly instead of drifting to a new port.
const PORT = Number(process.env.E2E_PORT) || 5173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Visual mode for debugging - runs headed with slowMo
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        launchOptions: {
          slowMo: 34,
        },
      },
    },
  ],
  webServer: {
    command: `bun run dev --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
