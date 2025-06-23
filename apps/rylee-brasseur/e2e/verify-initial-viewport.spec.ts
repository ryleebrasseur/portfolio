import { test, expect } from '@playwright/test'

test.describe('Initial Viewport - Hero Only', () => {
  test('should show ONLY hero content on load - nothing more, nothing less', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for any animations
    
    // 1. Verify main content area is visible
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
    
    // 2. Verify hero title is visible and correct
    const heroTitle = page.locator('.heroTitle')
    await expect(heroTitle).toBeVisible()
    await expect(heroTitle).toHaveText('Rylee Brasseur')
    
    // 3. Verify subtitle is visible and correct
    const heroSubtitle = page.getByText('International Relations Student')
    await expect(heroSubtitle).toBeVisible()
    
    // 4. Verify institution is visible and correct
    const heroInstitution = page.getByText('Michigan State University | James Madison College')
    await expect(heroInstitution).toBeVisible()
    
    // 5. Verify KineticPhone animation is visible
    const kineticPhone = page.locator('a[href^="tel:"]')
    await expect(kineticPhone).toBeVisible()
    // Phone cycles through different states
    const phoneText = await kineticPhone.textContent()
    expect(phoneText).toMatch(/332|NYC|RYLEE/) // Matches any animation state
    
    // 6. Verify email link is visible and correct
    const emailLink = page.locator('.heroContact a[href="mailto:hello@rysdesigns.com"]')
    await expect(emailLink).toBeVisible()
    await expect(emailLink).toHaveText('hello@rysdesigns.com')
    
    // 7. Verify scroll indicator is visible
    const scrollText = page.getByText('Scroll to explore')
    await expect(scrollText).toBeVisible()
    
    // 8. CRITICAL: Verify NO sticky header is visible
    const stickyHeader = page.locator('#sticky-header-container')
    const headerExists = await stickyHeader.count() > 0
    if (headerExists) {
      await expect(stickyHeader).not.toBeVisible()
    }
    
    // 9. Verify NO duplicate elements exist
    const heroTitleCount = await page.locator('.heroTitle').count()
    expect(heroTitleCount).toBe(1) // Only one hero title
    
    // Verify header is not visible at initial load
    const headerTitle = page.locator('#header-name')
    await expect(headerTitle).not.toBeVisible()
    
    // 10. Verify nothing is scrolled
    const scrollPosition = await page.evaluate(() => window.scrollY)
    expect(scrollPosition).toBe(0)
    
    // 11. Take a screenshot for visual verification
    await page.screenshot({
      path: './test-results/screenshots/initial-viewport-verification.png',
      fullPage: false, // ONLY the viewport
    })
    
    console.log('✅ Initial viewport shows ONLY hero content - nothing more, nothing less')
  })
  
  test('should have correct scroll height for motion', async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    
    console.log(`Document scroll height: ${scrollHeight}px`)
    console.log(`Viewport height: ${viewportHeight}px`)
    console.log(`Scrollable distance: ${scrollHeight - viewportHeight}px`)
    
    // Should have extra scroll room for the motion
    expect(scrollHeight).toBeGreaterThan(viewportHeight * 1.5)
  })
})