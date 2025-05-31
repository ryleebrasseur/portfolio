import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run tests sequentially in CI to avoid resource issues
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  timeout: 60000, // Increase default test timeout to 60s
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    navigationTimeout: 60000, // Increase navigation timeout
    actionTimeout: 30000, // Increase action timeout
    // Add screenshot on failure
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            // Disable GPU acceleration for better stability in CI
            'layers.acceleration.disabled': true,
            'gfx.webrender.all': false,
          },
        },
      },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes timeout for dev server to start
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
