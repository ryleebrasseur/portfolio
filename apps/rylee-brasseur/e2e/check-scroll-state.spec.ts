import { test } from './support/test-with-logging'

test('capture before and after scroll', async ({ page, logger }) => {
  await logger.logAction('Starting scroll state capture test')

  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  await logger.logAction('Page loaded and ready for scroll testing')

  // Capture initial scroll state
  const initialScrollState = await page.evaluate(() => ({
    scrollY: window.scrollY,
    scrollX: window.scrollX,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    documentHeight: document.documentElement.scrollHeight,
    documentWidth: document.documentElement.scrollWidth,
  }))

  await logger.logState('Initial scroll state', initialScrollState)

  // Screenshot 1: Initial state
  await page.screenshot({
    path: './test-results/screenshots/screenshot-before-scroll.png',
    fullPage: false,
  })
  await logger.logAction('Captured screenshot before scroll')

  // Calculate scroll target (150% of viewport height)
  const scrollTarget = initialScrollState.viewportHeight * 1.5
  await logger.logAction(
    `Scrolling to ${scrollTarget}px (150% of viewport height)`
  )

  // Scroll down 150% of viewport height
  await page.evaluate((target) => {
    window.scrollTo(0, target)
  }, scrollTarget)
  await page.waitForTimeout(1000) // Wait for animations

  // Capture scroll state after scrolling
  const afterScrollState = await page.evaluate(() => ({
    scrollY: window.scrollY,
    scrollX: window.scrollX,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    documentHeight: document.documentElement.scrollHeight,
    documentWidth: document.documentElement.scrollWidth,
    scrolledPercentage:
      (window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight)) *
      100,
  }))

  await logger.logState('After scroll state', afterScrollState)

  // Screenshot 2: After scroll
  await page.screenshot({
    path: './test-results/screenshots/screenshot-after-scroll.png',
    fullPage: false,
  })
  await logger.logAction('Captured screenshot after scroll')

  // Log scroll change details
  await logger.logState('Scroll change summary', {
    scrollDelta: afterScrollState.scrollY - initialScrollState.scrollY,
    expectedScroll: scrollTarget,
    actualScroll: afterScrollState.scrollY,
    scrollAccuracy:
      Math.abs(afterScrollState.scrollY - scrollTarget) < 5
        ? 'Accurate'
        : 'Inaccurate',
    scrolledPercentage: `${afterScrollState.scrolledPercentage.toFixed(2)}%`,
  })

  // Check if any elements changed visibility due to scroll
  const visibilityCheck = await page.evaluate(() => {
    const header = document.querySelector('#sticky-header-container')
    const hero = document.querySelector('.heroTitle')
    const scrollIndicator = document.querySelector(
      '[data-testid="scroll-indicator"]'
    )

    return {
      headerVisible: header
        ? window.getComputedStyle(header).opacity !== '0'
        : false,
      heroVisible: hero ? window.getComputedStyle(hero).opacity !== '0' : false,
      scrollIndicatorVisible: scrollIndicator
        ? window.getComputedStyle(scrollIndicator).display !== 'none'
        : false,
    }
  })

  await logger.logState('Element visibility after scroll', visibilityCheck)

  await logger.captureFullState('scroll-state-test-complete')
})
