import { test, expect } from '@playwright/test'

test('debug single transition to header', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  
  // Wait for initial hero state
  await page.waitForSelector('.heroTitle', { state: 'visible' })
  
  // Log initial state
  const initialIndex = await page.evaluate(() => (window as any).currentIndexRef?.current ?? 'undefined')
  console.log('Initial currentIndex:', initialIndex)
  
  // Trigger transition to header
  await page.evaluate(() => {
    console.log('Before testGotoSection - currentIndexRef:', (window as any).currentIndexRef)
    const result = (window as any).testGotoSection('header')
    console.log('testGotoSection result:', result)
  })
  
  // Wait longer for animation
  await page.waitForTimeout(2000)
  
  // Check if header is visible
  const headerExists = await page.locator('#sticky-header-container').count()
  console.log('Header exists in DOM:', headerExists)
  
  const headerVisible = await page.locator('#sticky-header-container').isVisible()
  console.log('Header visible:', headerVisible)
  
  const headerOpacity = await page.locator('#sticky-header-container').evaluate(el => {
    const styles = window.getComputedStyle(el)
    return styles.opacity
  })
  console.log('Header opacity:', headerOpacity)
  
  // Check hero state
  const heroOpacity = await page.locator('.heroTitle').evaluate(el => {
    const styles = window.getComputedStyle(el)
    return styles.opacity
  })
  console.log('Hero opacity:', heroOpacity)
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'test-results/debug-header-transition.png' })
  
  expect(headerVisible).toBe(true)
})