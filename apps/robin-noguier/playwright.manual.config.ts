import { defineConfig } from '@playwright/test'
import baseConfig from './playwright.config'

// Config for running manual/exhaustive tests
export default defineConfig({
  ...baseConfig,
  // Override to include manual tests
  testIgnore: undefined,
  testMatch: '**/*.manual.ts',
})
