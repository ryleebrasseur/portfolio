import { defineConfig } from '@playwright/test'
import baseConfig from './playwright.config'

// Coverage configuration extending base config
export default defineConfig({
  ...baseConfig,

  // Coverage-specific settings
  use: {
    ...baseConfig.use,
    // Enable coverage collection
    coverage: {
      enabled: true,
      include: [
        'src/**/*.{ts,tsx}',
        '../../../packages/motion-system/src/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/node_modules/**',
        '**/dist/**',
      ],
      reporter: ['html', 'json', 'lcov'],
      reportsDirectory: './coverage',
    },
  },

  // Add coverage reporter to existing reporters
  reporter: [['json'], ['html', { outputFolder: 'test-results' }], ['list']],

  // Global setup to instrument code
  globalSetup: './e2e/support/coverage-setup.ts',
  globalTeardown: './e2e/support/coverage-teardown.ts',
})
