import { test, expect } from '@playwright/test'

test('validate discrete state transitions', async ({ page }) => {
  const logs: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  })
  
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)
  
  // STEP 1: Verify initial hero state
  console.log('=== STEP 1: Verify initial hero state ===')
  await page.screenshot({ path: 'test-results/screenshots/state-1-initial-hero.png', fullPage: true })
  
  const heroTitle = page.locator('.heroTitle')
  await expect(heroTitle).toBeVisible()
  await expect(heroTitle).toHaveText('Rylee Brasseur')
  
  // Header should be created but hidden initially
  const headerContainer = page.locator('#sticky-header-container')
  await expect(headerContainer).toBeAttached() // exists in DOM
  await expect(headerContainer).not.toBeVisible() // but not visible
  
  // STEP 2: Transition to header state
  console.log('=== STEP 2: Transition to header state ===')
  await page.evaluate(() => {
    ;(window as any).testGotoSection('header')
  })
  
  // Wait for animation to complete
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/screenshots/state-2-after-header-transition.png', fullPage: true })
  
  // Header should now be visible
  await expect(headerContainer).toBeVisible()
  const headerName = page.locator('#header-name')
  await expect(headerName).toBeVisible()
  await expect(headerName).toHaveText('ry designs ❤️')
  
  // Hero elements should be faded out (opacity 0)
  const heroOpacity = await heroTitle.evaluate(el => window.getComputedStyle(el).opacity)
  console.log('Hero opacity after header transition:', heroOpacity)
  expect(parseFloat(heroOpacity)).toBeLessThan(0.1)
  
  // STEP 3: Transition back to hero state - THIS SHOULD WORK
  console.log('=== STEP 3: Transition back to hero state ===')
  await page.evaluate(() => {
    ;(window as any).testGotoSection('hero')
  })
  
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test-results/screenshots/state-3-back-to-hero.png', fullPage: true })
  
  // Hero should be visible again
  await expect(heroTitle).toBeVisible()
  const heroOpacityAfterReturn = await heroTitle.evaluate(el => window.getComputedStyle(el).opacity)
  console.log('Hero opacity after return:', heroOpacityAfterReturn)
  expect(parseFloat(heroOpacityAfterReturn)).toBeGreaterThan(0.9)
  
  // Header should be hidden
  const headerOpacityAfterReturn = await headerContainer.evaluate(el => window.getComputedStyle(el).opacity)
  console.log('Header opacity after return:', headerOpacityAfterReturn)
  expect(parseFloat(headerOpacityAfterReturn)).toBeLessThan(0.1)
  
  // STEP 4: Test multiple transitions work
  console.log('=== STEP 4: Test multiple transitions ===')
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
  
  // Print all logs for debugging
  console.log('=== ALL LOGS ===')
  console.log(logs.join('\n'))
  
  // Validate that state changes occurred in logs
  const hasHeaderTransition = logs.some(log => log.includes('gotoSection: 1'))
  const hasHeroTransition = logs.some(log => log.includes('gotoSection: 0'))
  const hasAnimationComplete = logs.some(log => log.includes('Animation complete'))
  
  expect(hasHeaderTransition).toBe(true)
  expect(hasHeroTransition).toBe(true)
  expect(hasAnimationComplete).toBe(true)
})