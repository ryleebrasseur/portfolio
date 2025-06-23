import { test, expect } from './support/fixtures'

test.describe('Initial State Verification', () => {
  test('should show ONLY hero content on load - nothing more, nothing less', async ({ motionPage }) => {
    await motionPage.captureState('01-initial-viewport.png', false)
    
    // Comprehensive initial state verification
    await motionPage.expectHeroState()
    
    // Verify specific content
    await expect(motionPage.heroTitle).toHaveText('Rylee Brasseur')
    await expect(motionPage.heroEmail).toHaveText('hello@rysdesigns.com')
    await expect(motionPage.scrollIndicator).toBeVisible()
    
    // Verify KineticPhone animation is visible
    const kineticPhone = motionPage.page.locator('a[href^="tel:"]')
    await expect(kineticPhone).toBeVisible()
    const phoneText = await kineticPhone.textContent()
    expect(phoneText).toMatch(/332|NYC|RYLEE/) // Matches any animation state
    
    // Verify NO sticky header visible
    const headerExists = await motionPage.headerContainer.count() > 0
    if (headerExists) {
      await expect(motionPage.headerContainer).not.toBeVisible()
    }
    
    // Verify only one hero title exists
    const heroTitleCount = await motionPage.page.locator('.heroTitle').count()
    expect(heroTitleCount).toBe(1)
    
    // Verify nothing is scrolled
    const scrollPosition = await motionPage.page.evaluate(() => window.scrollY)
    expect(scrollPosition).toBe(0)
    
    console.log('✅ Initial viewport shows ONLY hero content - nothing more, nothing less')
  })
  
  test('should have correct scroll height for motion', async ({ motionPage }) => {
    const scrollHeight = await motionPage.page.evaluate(() => document.documentElement.scrollHeight)
    const viewportHeight = await motionPage.page.evaluate(() => window.innerHeight)
    
    console.log(`Document scroll height: ${scrollHeight}px`)
    console.log(`Viewport height: ${viewportHeight}px`)
    console.log(`Scrollable distance: ${scrollHeight - viewportHeight}px`)
    
    // Should have extra scroll room for the motion
    expect(scrollHeight).toBeGreaterThan(viewportHeight * 1.5)
  })
})