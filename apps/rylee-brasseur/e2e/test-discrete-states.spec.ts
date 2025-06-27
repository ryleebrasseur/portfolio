import { test, expect } from './support/test-with-logging'
import siteConfig from '../src/config/site-config'

test('validate discrete state transitions', async ({ page, logger }) => {
  await logger.logAction('Starting discrete state transitions test')

  await logger.logAction('Navigating to page')
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000) // Wait for all animations and Observer setup

  // STEP 1: Verify initial hero state
  await logger.logAction('STEP 1: Verify initial hero state')
  await logger.captureFullState('initial-hero-state')

  const heroTitle = page.locator('.heroTitle')
  await expect(heroTitle).toBeVisible()
  await expect(heroTitle).toHaveText(siteConfig.hero.name)

  // Header should be created but hidden initially
  const headerContainer = page.locator('#sticky-header-container')
  await expect(headerContainer).toBeAttached() // exists in DOM
  await expect(headerContainer).not.toBeVisible() // but not visible

  // STEP 2: Transition to header state
  await logger.logAction('STEP 2: Transition to header state')

  // Check if testGotoSection exists
  const hasTestFunction = await page.evaluate(() => {
    return typeof (window as any).testGotoSection === 'function'
  })
  await logger.logState('testGotoSection availability', { hasTestFunction })

  if (!hasTestFunction) {
    throw new Error('testGotoSection function not found on window object')
  }

  await page.evaluate(() => {
    console.log('[Test] Calling testGotoSection("header")')
    ;(window as any).testGotoSection('header')
  })

  // Wait for animation to complete
  await page.waitForTimeout(2000)
  await logger.captureFullState('after-header-transition')

  // Header should now be visible
  await expect(headerContainer).toBeVisible()
  const headerName = page.locator('#header-name')
  await expect(headerName).toBeVisible()
  await expect(headerName).toHaveText(siteConfig.header.brandName)

  // Hero elements should be faded out (opacity 0)
  const heroOpacity = await heroTitle.evaluate(
    (el) => window.getComputedStyle(el).opacity
  )
  await logger.logState('Hero opacity after header transition', {
    opacity: heroOpacity,
  })
  expect(parseFloat(heroOpacity)).toBeLessThan(0.1)

  // STEP 3: Transition back to hero state - THIS SHOULD WORK
  await logger.logAction('STEP 3: Transition back to hero state')
  await page.evaluate(() => {
    console.log('[Test] Calling testGotoSection("hero")')
    ;(window as any).testGotoSection('hero')
  })

  await page.waitForTimeout(2000)
  await logger.captureFullState('back-to-hero')

  // Hero should be visible again
  await expect(heroTitle).toBeVisible()
  const heroOpacityAfterReturn = await heroTitle.evaluate(
    (el) => window.getComputedStyle(el).opacity
  )
  await logger.logState('Hero opacity after return', {
    opacity: heroOpacityAfterReturn,
  })
  expect(parseFloat(heroOpacityAfterReturn)).toBeGreaterThan(0.9)

  // Header should be hidden
  const headerOpacityAfterReturn = await headerContainer.evaluate(
    (el) => window.getComputedStyle(el).opacity
  )
  await logger.logState('Header opacity after return', {
    opacity: headerOpacityAfterReturn,
  })
  expect(parseFloat(headerOpacityAfterReturn)).toBeLessThan(0.1)

  // STEP 4: Test multiple transitions work
  await logger.logAction('STEP 4: Test multiple transitions')
  await page.evaluate(() => {
    ;(window as any).testGotoSection('header')
  })

  await page.waitForTimeout(2000)
  await expect(headerContainer).toBeVisible()

  await page.evaluate(() => {
    ;(window as any).testGotoSection('hero')
  })

  await page.waitForTimeout(2000)
  await expect(heroTitle).toBeVisible()

  // The enhanced logger has already captured all console logs
  await logger.logAction(
    'Test completed - check artifacts for full browser console logs'
  )
})
