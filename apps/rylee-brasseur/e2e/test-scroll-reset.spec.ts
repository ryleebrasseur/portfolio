import { test, expect } from './support/test-with-logging'

test('page refresh at bottom should reset to top', async ({ page, logger }) => {
  await logger.logAction('Starting page refresh scroll reset test')
  
  await logger.logAction('Navigating to page')
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  
  // Wait for page to load AND Observer setup
  await page.waitForSelector('.heroTitle', { state: 'visible' })
  await page.waitForTimeout(200) // Wait for Observer delay
  
  // Transition to header state (this is what would happen on scroll)
  await logger.logAction('Transitioning to header state')
  await page.evaluate(() => (window as any).testGotoSection('header'))
  await page.waitForTimeout(1500) // Wait for animation
  
  // Verify we're in header state
  const headerVisible = await page.locator('#sticky-header-container').isVisible()
  await logger.logState('Header state before refresh', { headerVisible })
  expect(headerVisible).toBe(true)
  
  await logger.captureFullState('before-refresh')
  
  // REFRESH THE PAGE
  await logger.logAction('Refreshing page')
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(200) // Wait for Observer delay
  
  // The enhanced logger already captures all console output
  await logger.logAction('Verifying Observer initialization after refresh')
  
  // After refresh, should be back in hero state (not header)
  const heroVisible = await page.locator('.heroTitle').isVisible()
  const headerVisibleAfterRefresh = await page.locator('#sticky-header-container').isVisible()
  
  await logger.logState('State after refresh', { 
    heroVisible, 
    headerVisible: headerVisibleAfterRefresh,
    scrollY: await page.evaluate(() => window.scrollY)
  })
  
  await logger.captureFullState('after-refresh')
  
  // Should be in hero state after refresh
  expect(heroVisible).toBe(true)
  expect(headerVisibleAfterRefresh).toBe(false)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test('multiple scroll cycles work correctly', async ({ page, logger }) => {
  await logger.logAction('Starting multiple scroll cycles test')
  
  await logger.logAction('Navigating to page')
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  
  // Wait for initial load AND Observer setup
  await logger.logAction('Waiting for Observer setup')
  await page.waitForSelector('.heroTitle', { state: 'visible' })
  await page.waitForTimeout(200) // Wait for Observer delay
  
  // Test multiple cycles
  for (let i = 0; i < 3; i++) {
    await logger.logAction(`Cycle ${i + 1}: Transitioning to header`)
    
    // Go to header
    await page.evaluate(() => (window as any).testGotoSection('header'))
    await page.waitForTimeout(1500) // Full animation duration
    
    const headerVisible = await page.locator('#sticky-header-container').isVisible()
    await logger.logState(`Cycle ${i + 1} header state`, { headerVisible })
    expect(headerVisible).toBe(true)
    
    await logger.logAction(`Cycle ${i + 1}: Transitioning back to hero`)
    
    // Back to hero
    await page.evaluate(() => (window as any).testGotoSection('hero'))
    await page.waitForTimeout(1500) // Full animation duration
    
    const heroVisible = await page.locator('.heroTitle').isVisible()
    await logger.logState(`Cycle ${i + 1} hero state`, { heroVisible })
    expect(heroVisible).toBe(true)
  }
  
  await logger.captureFullState('after-all-cycles')
})