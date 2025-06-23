import { test } from '@playwright/test'

test.describe('Portfolio Screenshots', () => {
  test('capture all themes with scroll positions', async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1280, height: 800 })

    // Navigate to the app
    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')

    // Wait for animations to settle
    await page.waitForTimeout(2000)

    const themes = [
      { id: 'sunset', label: 'Sunset' },
      { id: 'cyberpunk', label: 'Cyber' },
      { id: 'att', label: 'AT&T' },
      { id: 'msu', label: 'MSU' },
    ]
    const scrollPositions = [0, 25, 50, 75, 100] // Percentages

    for (const theme of themes) {
      // Click theme button to open dropdown
      await page.click('[aria-label="Theme options"]')
      await page.waitForTimeout(300)

      // Select theme using the exact aria-label
      await page.click(`[aria-label="Switch to ${theme.label} theme"]`)
      await page.waitForTimeout(1000) // Wait for theme transition

      // Capture at different scroll positions
      for (const scrollPercent of scrollPositions) {
        // Calculate scroll position
        const scrollHeight = await page.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight
        )
        const scrollTo = (scrollHeight * scrollPercent) / 100

        // Smooth scroll to position
        await page.evaluate((y) => {
          window.scrollTo({ top: y, behavior: 'smooth' })
        }, scrollTo)

        // Wait for scroll and animations
        await page.waitForTimeout(1500)

        // Take screenshot
        await page.screenshot({
          path: `screenshots/${theme.id}-scroll-${scrollPercent}.png`,
          fullPage: false,
        })

        console.log(`📸 Captured ${theme.id} at ${scrollPercent}% scroll`)
      }
    }

    // Capture modal state
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    await page.waitForTimeout(1000)

    // Click first project
    await page.click('[data-hover]:has-text("01")')
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `screenshots/modal-open.png`,
      fullPage: false,
    })

    console.log('📸 Captured modal state')
  })
})
