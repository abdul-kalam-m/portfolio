import { defineConfig, devices } from '@playwright/test';

/**
 * Tests run against the production build (§12.1 step 4), not the dev server — dev has
 * HMR clients and an unminified toolbar that neither the a11y scan nor the JS-budget
 * check should be looking at.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4322',
    url: 'http://localhost:4322',
    /*
     * Never reuse. A preview server left running from an earlier build makes the suite
     * pass against stale output — a false green that is worse than a slow run.
     */
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
