import { test, expect } from '@playwright/test'

test('debug observer system', async ({ page }) => {
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text())
    }
  })
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message)
  })
  
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  
  // Take screenshot to see current state
  await page.screenshot({ path: './test-results/screenshots/debug-initial-state.png', fullPage: true })
  
  // Check what elements exist
  const heroExists = await page.locator('.heroTitle').count()
  const heroTitleExists = await page.locator('h1').count() 
  const headerExists = await page.locator('#sticky-header-container').count()
  
  console.log('Hero title (.heroTitle):', heroExists)
  console.log('H1 elements:', heroTitleExists)
  console.log('Header container:', headerExists)
  
  // List all h1 elements and their classes
  const h1Elements = await page.locator('h1').all()
  for (let i = 0; i < h1Elements.length; i++) {
    const text = await h1Elements[i].textContent()
    const className = await h1Elements[i].getAttribute('class')
    console.log(`H1 ${i}: "${text}" - class: "${className}"`)
  }
  
  // Try scrolling to see what happens
  console.log('Triggering scroll down...')
  await page.mouse.wheel(0, 500)
  await page.waitForTimeout(2000)
  
  await page.screenshot({ path: './test-results/screenshots/debug-after-scroll.png', fullPage: true })
  
  // Check state after scroll
  const headerAfterScroll = await page.locator('#sticky-header-container').count()
  console.log('Header after scroll:', headerAfterScroll)
  
  if (headerAfterScroll > 0) {
    const headerOpacity = await page.locator('#sticky-header-container').evaluate(
      el => window.getComputedStyle(el).opacity
    )
    console.log('Header opacity:', headerOpacity)
  }
})