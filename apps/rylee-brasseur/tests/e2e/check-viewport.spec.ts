import { test } from './support/test-with-logging'

test('capture initial viewport', async ({ page, logger }) => {
  await logger.logAction('Starting viewport capture test')

  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // Wait for animations
  await logger.logAction('Page loaded and animations settled')

  // Capture viewport dimensions before screenshot
  const viewportSize = page.viewportSize()
  await logger.logState('Viewport dimensions', {
    width: viewportSize?.width,
    height: viewportSize?.height,
  })

  // Get actual window dimensions from the page
  const windowDimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    devicePixelRatio: window.devicePixelRatio,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  }))

  await logger.logState('Window and screen dimensions', windowDimensions)

  await page.screenshot({
    path: './test-results/screenshots/viewport-screenshot.png',
    fullPage: false,
  })

  await logger.logAction(
    'Screenshot saved to ./test-results/screenshots/viewport-screenshot.png'
  )

  // Capture scroll information
  const scrollInfo = await page.evaluate(() => ({
    scrollY: window.scrollY,
    scrollX: window.scrollX,
    documentHeight: document.documentElement.scrollHeight,
    documentWidth: document.documentElement.scrollWidth,
    clientHeight: document.documentElement.clientHeight,
    clientWidth: document.documentElement.clientWidth,
  }))

  await logger.logState('Scroll and document information', scrollInfo)

  // Check if page is scrollable
  const isScrollable = scrollInfo.documentHeight > scrollInfo.clientHeight
  await logger.logState('Page scrollability', {
    isScrollable,
    scrollableHeight: scrollInfo.documentHeight - scrollInfo.clientHeight,
  })

  await logger.captureFullState('viewport-check-complete')
})
