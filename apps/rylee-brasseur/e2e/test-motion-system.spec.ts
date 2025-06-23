import { test } from '@playwright/test'

test.describe('Motion System - Hero to Header Transformation', () => {
  test('capture screenshots at all scroll positions', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for animations to initialize
    
    // Get the total scrollable height
    const totalHeight = await page.evaluate(() => {
      return document.documentElement.scrollHeight - window.innerHeight
    })
    
    // Define scroll positions to capture
    const scrollPositions = [
      { percent: 0, description: 'Initial hero state' },
      { percent: 10, description: 'Scale down begins' },
      { percent: 25, description: 'Text morphing starts' },
      { percent: 40, description: 'Text changed, movement begins' },
      { percent: 50, description: 'Elements mid-flight' },
      { percent: 60, description: 'Approaching header' },
      { percent: 75, description: 'Header becoming visible' },
      { percent: 90, description: 'Final positions' },
      { percent: 100, description: 'Sticky header complete' },
    ]
    
    // Capture screenshot at each position
    for (const position of scrollPositions) {
      const scrollY = (totalHeight * position.percent) / 100
      
      // Scroll to position
      await page.evaluate((y) => {
        window.scrollTo({ top: y, behavior: 'instant' })
      }, scrollY)
      
      // Wait for animations to settle
      await page.waitForTimeout(500)
      
      // Take screenshot
      await page.screenshot({
        path: `./test-results/screenshots/motion-test-${position.percent}pct.png`,
        fullPage: false,
      })
      
      console.log(`Captured ${position.percent}%: ${position.description}`)
    }
    
    // Also capture with markers enabled for debugging
    await page.evaluate(() => {
      // Enable ScrollTrigger markers
      if (window.ScrollTrigger) {
        window.ScrollTrigger.defaults({ markers: true })
        window.ScrollTrigger.refresh()
      }
    })
    
    // Capture one with markers at 50%
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'instant' })
    }, totalHeight * 0.5)
    
    await page.waitForTimeout(500)
    await page.screenshot({
      path: './test-results/screenshots/motion-test-50pct-with-markers.png',
      fullPage: false,
    })
    
    console.log('All screenshots captured successfully')
  })
  
  test('verify text morphing during scroll', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Check initial text
    const initialName = await page.textContent('.heroTitle')
    const initialTitle = await page.textContent('.heroSubtitle')
    
    console.log('Initial name:', initialName)
    console.log('Initial title:', initialTitle)
    
    // Scroll to 50%
    const totalHeight = await page.evaluate(() => {
      return document.documentElement.scrollHeight - window.innerHeight
    })
    
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'instant' })
    }, totalHeight * 0.5)
    
    await page.waitForTimeout(1000)
    
    // Check if text has changed
    const midName = await page.textContent('.heroTitle')
    const midTitle = await page.textContent('.heroSubtitle')
    
    console.log('Mid-scroll name:', midName)
    console.log('Mid-scroll title:', midTitle)
    
    // Scroll to 100%
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'instant' })
    }, totalHeight)
    
    await page.waitForTimeout(1000)
    
    // Check for sticky header
    const stickyHeader = await page.$('#sticky-header-container')
    if (stickyHeader) {
      const headerVisible = await stickyHeader.isVisible()
      console.log('Sticky header visible:', headerVisible)
      
      // Get header content
      const headerContent = await stickyHeader.textContent()
      console.log('Header content:', headerContent)
      
      // Verify header has correct content
      if (!headerContent.includes('ry designs ❤️')) {
        throw new Error('Header should contain "ry designs ❤️"')
      }
      if (!headerContent.includes('IR Student • MSU')) {
        throw new Error('Header should contain "IR Student • MSU"')
      }
    } else {
      console.log('No sticky header found')
    }
  })
})