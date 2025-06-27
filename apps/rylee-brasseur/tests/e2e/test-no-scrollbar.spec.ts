import { test, expect } from './support/test-with-logging'

test('no scrollbar and correct scroll text on desktop', async ({
  page,
  logger,
}) => {
  await logger.logAction('Starting no scrollbar and scroll text desktop test')
  await logger.logAction('Setting viewport to desktop: 1920x1080')
  await page.setViewportSize({ width: 1920, height: 1080 })

  await logger.logAction('Navigating to page')
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await logger.logAction('Page loaded successfully')

  // Check no vertical scrollbar
  await logger.logAction('Checking vertical scrollbar presence')
  const scrollHeight = await page.evaluate(
    () => document.documentElement.scrollHeight
  )
  const clientHeight = await page.evaluate(
    () => document.documentElement.clientHeight
  )
  const hasVerticalScrollbar = scrollHeight > clientHeight

  await logger.logState('Scrollbar check', {
    scrollHeight,
    clientHeight,
    hasVerticalScrollbar,
  })

  expect(hasVerticalScrollbar).toBe(false)

  // Check scroll indicator exists
  const scrollIndicator = await page.locator('div[class*="scrollIndicator"]')
  await expect(scrollIndicator).toBeVisible()

  // Check desktop text is visible and mobile text is hidden
  const spans = await scrollIndicator.locator('span').all()
  expect(spans.length).toBe(2) // Should have both desktop and mobile spans

  // Check first span (desktop) is visible
  const desktopVisible = await spans[0].isVisible()
  expect(desktopVisible).toBe(true)

  // Check second span (mobile) is hidden
  const mobileVisible = await spans[1].isVisible()
  expect(mobileVisible).toBe(false)

  // Check text content
  const desktopText = await spans[0].textContent()
  await logger.logState('Desktop text content', { text: desktopText })
  expect(desktopText).toBe('Scroll / Drag to explore')

  await logger.captureFullState('desktop-final-state')
})

test('correct scroll text on mobile', async ({ page, logger }) => {
  await logger.logAction('Starting mobile scroll text test')
  await logger.logAction('Setting viewport to mobile: 375x667')
  await page.setViewportSize({ width: 375, height: 667 })

  await logger.logAction('Navigating to page')
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')

  // Check scroll indicator exists
  const scrollIndicator = await page.locator('div[class*="scrollIndicator"]')
  await expect(scrollIndicator).toBeVisible()

  // Check mobile text is visible and desktop text is hidden
  const spans = await scrollIndicator.locator('span').all()
  expect(spans.length).toBe(2) // Should have both desktop and mobile spans

  // Check first span (desktop) is hidden
  const desktopVisible = await spans[0].isVisible()
  expect(desktopVisible).toBe(false)

  // Check second span (mobile) is visible
  const mobileVisible = await spans[1].isVisible()
  expect(mobileVisible).toBe(true)

  // Check text content
  const mobileText = await spans[1].textContent()
  await logger.logState('Mobile text content', { text: mobileText })
  expect(mobileText).toBe('Swipe to explore')

  await logger.captureFullState('mobile-final-state')
})
