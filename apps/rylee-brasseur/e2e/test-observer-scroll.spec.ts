import { test, expect } from './support/test-with-logging'

test('Observer pattern responds to actual scroll events', async ({
  page,
  logger,
}) => {
  await logger.logAction('Starting Observer pattern test')

  await logger.logAction('Navigating to page')
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(200) // Wait for Observer setup

  await logger.logAction('Waiting for hero state')
  await page.waitForSelector('.heroTitle', { state: 'visible' })

  // Capture initial state
  await logger.captureFullState('initial-hero')

  await logger.logAction('Checking initial scroll position')
  const initialScrollY = await page.evaluate(() => window.scrollY)
  await logger.logState('Initial scroll', { scrollY: initialScrollY })
  expect(initialScrollY).toBe(0)

  await logger.logAction('Triggering scroll down with wheel event')
  await page.mouse.wheel(0, 100)
  await page.waitForTimeout(1500) // Wait for animation

  await logger.captureFullState('after-scroll-down')

  // The logger is already capturing all console output, so we can check the logs
  await logger.logAction('Verifying Observer detected scroll')

  // Should transition to header state
  const headerVisible = await page
    .locator('#sticky-header-container')
    .isVisible()
  expect(headerVisible).toBe(true)

  // Hero should be hidden
  const heroHidden = await page.locator('.heroTitle').evaluate((el) => {
    const styles = window.getComputedStyle(el)
    return styles.opacity === '0' || styles.visibility === 'hidden'
  })
  expect(heroHidden).toBe(true)

  // Now scroll up
  await page.mouse.wheel(0, -100)
  await page.waitForTimeout(1500)

  // Should transition back to hero
  const heroVisibleAgain = await page.locator('.heroTitle').isVisible()
  expect(heroVisibleAgain).toBe(true)

  // Header should be hidden
  const headerHiddenAgain = await page
    .locator('#sticky-header-container')
    .evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.opacity === '0' || styles.visibility === 'hidden'
    })
  expect(headerHiddenAgain).toBe(true)

  // CRITICAL: Scroll position should be reset to 0
  const finalScrollY = await page.evaluate(() => window.scrollY)
  expect(finalScrollY).toBe(0)
})

test('Observer prevents scroll during animation', async ({ page, logger }) => {
  await logger.logAction('Starting Observer scroll prevention test')

  await logger.logAction('Navigating to page')
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')

  await logger.logAction('Waiting for hero state')
  await page.waitForSelector('.heroTitle', { state: 'visible' })

  // Trigger first scroll
  await logger.logAction('Triggering first scroll event')
  await page.mouse.wheel(0, 100)

  // Immediately try to scroll again (should be blocked)
  await logger.logAction('Attempting rapid scroll events (should be blocked)')
  await page.mouse.wheel(0, 100)
  await page.mouse.wheel(0, 100)

  // Wait for animation to complete
  await page.waitForTimeout(1500)

  await logger.captureFullState('after-rapid-scroll-down')

  // Should only be in header state (not scrolled multiple times)
  await logger.logAction('Verifying single state transition occurred')
  const headerVisible = await page
    .locator('#sticky-header-container')
    .isVisible()
  expect(headerVisible).toBe(true)

  // Try rapid scrolling back
  await logger.logAction('Attempting rapid scroll back (should be blocked)')
  await page.mouse.wheel(0, -100)
  await page.mouse.wheel(0, -100)
  await page.mouse.wheel(0, -100)

  await page.waitForTimeout(1500)

  await logger.captureFullState('after-rapid-scroll-up')

  // Should be back in hero state (animation blocking worked)
  await logger.logAction('Verifying animation blocking worked')
  const heroVisible = await page.locator('.heroTitle').isVisible()
  expect(heroVisible).toBe(true)
})
