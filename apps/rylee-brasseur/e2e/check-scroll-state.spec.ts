import { test } from '@playwright/test'

test('capture before and after scroll', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  
  // Screenshot 1: Initial state
  await page.screenshot({ 
    path: './test-results/screenshots/screenshot-before-scroll.png',
    fullPage: false 
  })
  
  // Scroll down 150% of viewport height
  await page.evaluate(() => {
    window.scrollTo(0, window.innerHeight * 1.5)
  })
  await page.waitForTimeout(1000) // Wait for animations
  
  // Screenshot 2: After scroll
  await page.screenshot({ 
    path: './test-results/screenshots/screenshot-after-scroll.png',
    fullPage: false 
  })
  
  console.log('Screenshots saved: before and after scroll')
})