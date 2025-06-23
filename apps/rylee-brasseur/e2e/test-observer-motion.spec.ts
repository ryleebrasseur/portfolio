import { test, expect } from '@playwright/test'

test.describe('Observer-Based Motion System', () => {
  test('should transition between hero and header states on scroll events', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Initial state - should be hero
    await page.screenshot({ path: './test-results/screenshots/initial-hero-state.png', fullPage: false })
    
    const heroTitle = page.locator('.heroTitle')
    const headerName = page.locator('#header-name')
    
    // Verify initial hero state
    await expect(heroTitle).toBeVisible()
    const heroOpacity = await heroTitle.evaluate(el => window.getComputedStyle(el).opacity)
    expect(parseFloat(heroOpacity)).toBe(1)
    
    // Header should be hidden initially
    const headerExists = await headerName.count() > 0
    if (headerExists) {
      const headerOpacity = await headerName.evaluate(el => window.getComputedStyle(el).opacity)
      expect(parseFloat(headerOpacity)).toBe(0)
    }
    
    console.log('✅ Initial state verified: Hero visible, header hidden')
    
    // Trigger scroll down event (should transition to header)
    await page.mouse.wheel(0, 500) // Scroll down
    await page.waitForTimeout(1500) // Wait for animation to complete
    
    await page.screenshot({ path: './test-results/screenshots/after-scroll-down.png', fullPage: false })
    
    // Check if transition happened
    const heroOpacityAfterScroll = await heroTitle.evaluate(el => window.getComputedStyle(el).opacity)
    console.log('Hero opacity after scroll:', heroOpacityAfterScroll)
    
    if (headerExists) {
      const headerOpacityAfterScroll = await headerName.evaluate(el => window.getComputedStyle(el).opacity)
      console.log('Header opacity after scroll:', headerOpacityAfterScroll)
      
      // The Observer pattern should create discrete state changes
      // Either hero is visible OR header is visible, not gradual fading
      const heroVisible = parseFloat(heroOpacityAfterScroll) > 0.5
      const headerVisible = parseFloat(headerOpacityAfterScroll) > 0.5
      
      // One should be visible, the other should not
      expect(heroVisible !== headerVisible).toBe(true)
      
      // If header is now visible, verify content
      if (headerVisible) {
        const headerText = await headerName.textContent()
        expect(headerText).toBe('ry designs ❤️')
        console.log('✅ Header state verified: Correct morphed content')
      }
    }
    
    // Trigger scroll up event (should transition back to hero)
    await page.mouse.wheel(0, -500) // Scroll up
    await page.waitForTimeout(1500) // Wait for animation to complete
    
    await page.screenshot({ path: './test-results/screenshots/after-scroll-up.png', fullPage: false })
    
    // Should be back to hero state
    const finalHeroOpacity = await heroTitle.evaluate(el => window.getComputedStyle(el).opacity)
    console.log('Final hero opacity:', finalHeroOpacity)
    
    // Hero should be visible again
    expect(parseFloat(finalHeroOpacity)).toBeGreaterThan(0.5)
    console.log('✅ Return state verified: Back to hero')
  })
  
  test('should prevent simultaneous animations', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    // Rapidly trigger multiple scroll events
    await page.mouse.wheel(0, 500)
    await page.mouse.wheel(0, 500) // Should be ignored due to animating flag
    await page.mouse.wheel(0, -500) // Should be ignored
    
    await page.waitForTimeout(2000)
    
    // Should still be in a valid state (either hero or header, not broken)
    const heroTitle = page.locator('.heroTitle')
    const headerName = page.locator('#header-name')
    
    const heroOpacity = await heroTitle.evaluate(el => window.getComputedStyle(el).opacity)
    let headerOpacity = 0
    
    const headerExists = await headerName.count() > 0
    if (headerExists) {
      headerOpacity = parseFloat(await headerName.evaluate(el => window.getComputedStyle(el).opacity))
    }
    
    // Should be in a discrete state, not mid-animation
    const heroVisible = parseFloat(heroOpacity) > 0.8
    const headerVisible = headerOpacity > 0.8
    
    // Exactly one should be fully visible
    expect(heroVisible || headerVisible).toBe(true)
    expect(heroVisible && headerVisible).toBe(false)
    
    console.log('✅ Animation queueing works: No broken mid-animation state')
  })
})