import { test } from './support/test-with-logging'
import siteConfig from '../src/config/site-config.json' assert { type: 'json' }

test('debug observer system', async ({ page, logger }) => {
  await logger.logAction('Starting observer system debug test')

  // Capture console errors (enhanced logger already captures these, but we'll add specific handling)
  page.on('console', async (msg) => {
    if (msg.type() === 'error') {
      await logger.logAction(`CONSOLE ERROR captured: ${msg.text()}`)
    }
  })

  // Capture page errors
  page.on('pageerror', async (error) => {
    await logger.logAction(`PAGE ERROR captured: ${error.message}`)
  })

  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  await logger.logAction('Page loaded for observer testing')

  // Take screenshot to see current state
  await page.screenshot({
    path: './test-results/screenshots/debug-initial-state.png',
    fullPage: true,
  })
  await logger.logAction('Captured initial state screenshot')

  // Check what elements exist
  const heroExists = await page.locator('.heroTitle').count()
  const heroTitleExists = await page.locator('h1').count()
  const headerExists = await page.locator('#sticky-header-container').count()

  await logger.logState('Element existence check', {
    heroTitleClass: heroExists,
    h1Elements: heroTitleExists,
    headerContainer: headerExists,
  })

  // List all h1 elements and their classes
  const h1Elements = await page.locator('h1').all()
  const h1Details = []
  for (let i = 0; i < h1Elements.length; i++) {
    const text = await h1Elements[i].textContent()
    const className = await h1Elements[i].getAttribute('class')
    h1Details.push({
      index: i,
      text,
      className,
    })
  }
  await logger.logState('H1 element details', h1Details)

  // Try scrolling to see what happens
  await logger.logAction('Triggering scroll down by 500px')
  await page.mouse.wheel(0, 500)
  await page.waitForTimeout(2000)

  await page.screenshot({
    path: './test-results/screenshots/debug-after-scroll.png',
    fullPage: true,
  })
  await logger.logAction('Captured post-scroll screenshot')

  // Check state after scroll
  const headerAfterScroll = await page
    .locator('#sticky-header-container')
    .count()
  await logger.logState('Header existence after scroll', {
    count: headerAfterScroll,
  })

  if (headerAfterScroll > 0) {
    const headerOpacity = await page
      .locator('#sticky-header-container')
      .evaluate((el) => window.getComputedStyle(el).opacity)
    await logger.logState('Header opacity after scroll', {
      opacity: headerOpacity,
    })

    // Verify header contains expected content
    const headerName = await page.locator('#header-name').textContent()
    const headerEmail = await page.locator('#header-email').textContent()
    await logger.logState('Header content', {
      name: headerName,
      expectedName: siteConfig.header.brandName,
      nameMatches: headerName === siteConfig.header.brandName,
      email: headerEmail,
    })
  }

  // Check hero element state after scroll
  const heroOpacityAfterScroll = await page
    .locator('.heroTitle')
    .evaluate((el) => window.getComputedStyle(el).opacity)
  await logger.logState('Hero opacity after scroll', {
    opacity: heroOpacityAfterScroll,
  })

  // Test scroll position
  const scrollPosition = await page.evaluate(() => ({
    scrollY: window.scrollY,
    scrollX: window.scrollX,
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }))
  await logger.logState('Scroll position details', scrollPosition)

  await logger.captureFullState('observer-system-debug-complete')
})
