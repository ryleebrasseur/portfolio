import { test, expect } from '@playwright/test'

test('timeline control with direct function call', async ({ page }) => {
  // Capture console logs
  const logs: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  })
  
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000) // Wait for orchestrator to initialize
  
  // Take initial screenshot
  await page.screenshot({ path: './test-results/screenshots/timeline-initial.png', fullPage: true })
  
  // Check initial state - hero should be visible
  const heroTitle = page.locator('.heroTitle')
  await expect(heroTitle).toBeVisible()
  
  // Call the exposed test function to trigger hero->header transition
  await page.evaluate(() => {
    if ((window as any).testGotoSection) {
      console.log('Calling testGotoSection(header)')
      ;(window as any).testGotoSection('header')
    } else {
      console.log('testGotoSection not available')
    }
  })
  
  // Wait for animation to complete
  await page.waitForTimeout(2000)
  
  // Take screenshot after transition
  await page.screenshot({ path: './test-results/screenshots/timeline-after-header.png', fullPage: true })
  
  // Check that header is now visible
  const headerContainer = page.locator('#sticky-header-container')
  await expect(headerContainer).toBeVisible()
  
  // Check header opacity
  const headerOpacity = await headerContainer.evaluate(
    el => window.getComputedStyle(el).opacity
  )
  console.log('Header opacity after transition:', headerOpacity)
  expect(parseFloat(headerOpacity)).toBeGreaterThan(0.5)
  
  // Try reverse transition
  await page.evaluate(() => {
    if ((window as any).testGotoSection) {
      console.log('Calling testGotoSection(hero)')
      ;(window as any).testGotoSection('hero')
    }
  })
  
  await page.waitForTimeout(2000)
  await page.screenshot({ path: './test-results/screenshots/timeline-back-to-hero.png', fullPage: true })
  
  // Check that hero is visible again
  await expect(heroTitle).toBeVisible()
  
  // Print all logs for debugging
  console.log('All logs:', logs.join('\n'))
})