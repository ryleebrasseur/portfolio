import { test as base, expect } from '@playwright/test'
import { MotionSystemPage } from './MotionSystemPage'

// Test constants
export const TEST_CONFIG = {
  BASE_URL: 'http://localhost:5173',
  TIMEOUTS: {
    ANIMATION: 2000,
    SCROLL: 1500,
    LOAD: 2000,
  },
  SCREENSHOTS: {
    PATH: './test-results/screenshots/',
  }
} as const

// Extended test fixture with MotionSystemPage
type TestFixtures = {
  motionPage: MotionSystemPage
}

export const test = base.extend<TestFixtures>({
  motionPage: async ({ page }, use) => {
    const motionPage = new MotionSystemPage(page)
    await motionPage.goto()
    await use(motionPage)
  },
})

export { expect }