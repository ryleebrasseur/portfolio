import { test, expect } from './support/fixtures'

test.describe('Basic Functionality', () => {
  test('should capture viewport and scroll states', async ({ motionPage }) => {
    // Initial viewport
    await motionPage.captureState('03-viewport-initial.png', false)
    
    // Scroll down to see layout changes
    await motionPage.page.evaluate(() => {
      window.scrollTo(0, window.innerHeight * 1.5)
    })
    await motionPage.page.waitForTimeout(1000)
    
    await motionPage.captureState('03-viewport-after-scroll.png', false)
    
    // Verify content is still accessible
    await expect(motionPage.heroTitle).toBeVisible()
    
    console.log('✅ Basic viewport and scroll functionality verified')
  })
  
  test('should verify all interactive elements work', async ({ motionPage }) => {
    // Test email link
    await expect(motionPage.heroEmail).toHaveAttribute('href', 'mailto:hello@rysdesigns.com')
    
    // Test phone number (KineticPhone animation)
    const phoneLink = motionPage.page.locator('a[href^="tel:"]')
    await expect(phoneLink).toBeVisible()
    
    // Test motion system integration
    const motionFunction = await motionPage.page.evaluate(() => {
      return typeof (window as any).testGotoSection === 'function'
    })
    expect(motionFunction).toBe(true)
    
    console.log('✅ All interactive elements verified')
  })
})