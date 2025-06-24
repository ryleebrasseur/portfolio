import { test, expect } from '@playwright/test'

test('verify no duplicate headers and animation works', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.waitForTimeout(2000)
  
  // Test: Check for duplicate header bug (CRITICAL)
  const headerCount = await page.locator('#sticky-header-container').count()
  expect(headerCount).toBeLessThanOrEqual(1) // Should be 0 or 1, never more
  
  // Screenshot 1: Hero state
  await page.screenshot({ path: './test-results/screenshots/1-hero-state.png', fullPage: false })
  
  // Trigger header transition
  await page.evaluate(() => (window as any).testGotoSection('header'))
  await page.waitForTimeout(2000)
  
  // Test: Verify no duplicates after animation
  const headerCountAfter = await page.locator('#sticky-header-container').count()
  expect(headerCountAfter).toBe(1) // Should be exactly 1
  
  // Screenshot 2: Header state  
  await page.screenshot({ path: './test-results/screenshots/2-header-state.png', fullPage: false })
  
  // Test: Verify header phone KINETIC ANIMATION (not just text change)
  const headerPhone = page.locator('#header-phone')
  await expect(headerPhone).toBeVisible()
  
  // Capture screenshots during animation to verify ACTUAL MOTION
  await page.screenshot({ path: './test-results/screenshots/phone-before-flip.png', fullPage: false })
  
  // Wait for animation to start
  await page.waitForTimeout(1500)
  
  // THIS SHOULD CAPTURE THE FLIP ANIMATION IN PROGRESS
  await page.screenshot({ path: './test-results/screenshots/phone-during-flip.png', fullPage: false })
  
  // Wait for animation to complete
  await page.waitForTimeout(2000)
  
  await page.screenshot({ path: './test-results/screenshots/phone-after-flip.png', fullPage: false })
  
  // Test for ACTUAL animation properties - check if elements have transforms/rotations
  const flipContainers = page.locator('#header-phone .flipContainer')
  const flipperElements = page.locator('#header-phone .flipper')
  
  // These should exist if kinetic animation is working
  const containerCount = await flipContainers.count()
  const flipperCount = await flipperElements.count()
  
  console.log(`Header phone containers: ${containerCount}, flippers: ${flipperCount}`)
  
  // THIS WILL FAIL - no kinetic structure exists in header
  expect(containerCount).toBeGreaterThan(0) // Should have flip containers
  expect(flipperCount).toBeGreaterThan(0)   // Should have flipper elements
})