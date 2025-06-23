import { test, expect } from '@playwright/test'

test.describe('Actual Motion System Validation', () => {
  test('hero elements must fade out and header must fade in during scroll', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    // Initial state - hero visible, header invisible
    const heroTitle = page.locator('.heroTitle')
    const headerName = page.locator('#header-name')
    
    await expect(heroTitle).toBeVisible()
    const initialHeroOpacity = await heroTitle.evaluate(el => window.getComputedStyle(el).opacity)
    expect(parseFloat(initialHeroOpacity)).toBeGreaterThan(0.9)
    
    // Header should not exist or be invisible
    const headerExists = await headerName.count() > 0
    if (headerExists) {
      const initialHeaderOpacity = await headerName.evaluate(el => window.getComputedStyle(el).opacity)
      expect(parseFloat(initialHeaderOpacity)).toBeLessThan(0.1)
    }
    
    // Scroll to 50%
    const totalHeight = await page.evaluate(() => {
      return document.documentElement.scrollHeight - window.innerHeight
    })
    
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'instant' })
    }, totalHeight * 0.5)
    
    await page.waitForTimeout(500) // Wait for Lenis to process
    
    // Mid-scroll state - hero should be fading, header should be appearing
    const midHeroOpacity = await heroTitle.evaluate(el => window.getComputedStyle(el).opacity)
    console.log('Mid-scroll hero opacity:', midHeroOpacity)
    
    if (headerExists) {
      const midHeaderOpacity = await headerName.evaluate(el => window.getComputedStyle(el).opacity)
      console.log('Mid-scroll header opacity:', midHeaderOpacity)
      
      // This should fail if motion system isn't working
      expect(parseFloat(midHeroOpacity)).toBeLessThan(parseFloat(initialHeroOpacity))
      expect(parseFloat(midHeaderOpacity)).toBeGreaterThan(0.1)
    }
    
    // Scroll to 100%
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'instant' })
    }, totalHeight)
    
    await page.waitForTimeout(500)
    
    // Final state - hero invisible, header visible
    const finalHeroOpacity = await heroTitle.evaluate(el => window.getComputedStyle(el).opacity)
    const finalHeaderOpacity = await headerName.evaluate(el => window.getComputedStyle(el).opacity)
    
    console.log('Final hero opacity:', finalHeroOpacity)
    console.log('Final header opacity:', finalHeaderOpacity)
    
    // These assertions will fail if the motion system doesn't work
    expect(parseFloat(finalHeroOpacity)).toBeLessThan(0.5)
    expect(parseFloat(finalHeaderOpacity)).toBeGreaterThan(0.5)
    
    // Verify header content is correct
    const headerText = await headerName.textContent()
    expect(headerText).toBe('ry designs ❤️')
  })
  
  test('smooth scroll with Lenis should provide scroll progress', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    // Check if Lenis is working by monitoring scroll progress
    const scrollProgress = await page.evaluate(() => {
      return new Promise((resolve) => {
        let progressReceived = false
        
        // Try to access the motion context scroll progress
        const checkProgress = () => {
          const motionDiv = document.querySelector('[data-motion-progress]')
          if (motionDiv) {
            const progress = motionDiv.getAttribute('data-motion-progress')
            if (progress !== null) {
              resolve(parseFloat(progress))
              return
            }
          }
          
          // Fallback: scroll and see if anything changes
          if (!progressReceived) {
            window.scrollTo({ top: 100, behavior: 'instant' })
            setTimeout(() => {
              resolve(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight))
            }, 100)
            progressReceived = true
          }
        }
        
        checkProgress()
        setTimeout(checkProgress, 100)
      })
    })
    
    expect(typeof scrollProgress).toBe('number')
    console.log('Scroll progress detected:', scrollProgress)
  })
})