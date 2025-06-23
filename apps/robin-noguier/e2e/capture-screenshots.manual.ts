import { test } from '@playwright/test'

test.describe.configure({ mode: 'parallel' })

const themes = [
  { id: 'sunset', label: 'Sunset' },
  { id: 'cyberpunk', label: 'Cyber' },
  { id: 'att', label: 'AT&T' },
  { id: 'msu', label: 'MSU' },
]

const fonts = [
  { label: 'Playfair Display', variable: '--font-serif-fashion' },
  { label: 'Bodoni Moda', variable: '--font-serif-editorial' },
  { label: 'Montserrat', variable: '--font-sans-modern' },
  { label: 'Oswald', variable: '--font-sans-strong' },
  { label: 'Bebas Neue', variable: '--font-display-bold' },
  { label: 'Russo One', variable: '--font-display-tech' },
  { label: 'Archivo Black', variable: '--font-display-impact' },
]

const scrollPositions = [0, 25, 50, 75, 100] // Percentages

test.describe('Portfolio Screenshots', () => {
  // Parallel test for each theme
  for (const theme of themes) {
    test(`capture ${theme.id} theme with fonts and scroll`, async ({
      page,
    }) => {
      // Set viewport
      await page.setViewportSize({ width: 1280, height: 800 })

      // Navigate to the app
      await page.goto('http://localhost:5173/portfolio/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Open control panel by clicking the name
      await page.click('button[aria-label="Open customization panel"]')
      await page.waitForTimeout(500)

      // Select theme
      await page.click(`[aria-label="Switch to ${theme.label} theme"]`)
      await page.waitForTimeout(1000)

      // Close control panel
      await page.click('button[aria-label="Close panel"]')
      await page.waitForTimeout(500)

      // Capture with different fonts
      for (const font of fonts.slice(0, 3)) {
        // Sample 3 fonts per theme to limit screenshots
        // Open control panel to change font
        await page.click('button[aria-label="Open customization panel"]')
        await page.waitForTimeout(500)

        // Select font
        await page.click(`button:has-text("${font.label}")`)
        await page.waitForTimeout(500)

        // Close control panel
        await page.click('button[aria-label="Close panel"]')
        await page.waitForTimeout(500)

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
          const fontSlug = font.label.toLowerCase().replace(/\s+/g, '-')
          await page.screenshot({
            path: `screenshots/${theme.id}-${fontSlug}-scroll-${scrollPercent}.png`,
            fullPage: false,
          })

          console.log(
            `📸 ${theme.id} + ${font.label} at ${scrollPercent}% scroll`
          )
        }
      }
    })
  }

  // Separate test for full-page captures
  test('capture full page views', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    for (const theme of themes.slice(0, 2)) {
      // Sample 2 themes for full page
      // Open control panel by clicking the name
      await page.click('button[aria-label="Open customization panel"]')
      await page.waitForTimeout(500)

      // Select theme
      await page.click(`[aria-label="Switch to ${theme.label} theme"]`)
      await page.waitForTimeout(1000)

      // Close control panel
      await page.click('button[aria-label="Close panel"]')
      await page.waitForTimeout(500)

      // Take full page screenshot
      await page.screenshot({
        path: `screenshots/${theme.id}-full-page.png`,
        fullPage: true,
      })

      console.log(`📸 Full page capture: ${theme.id}`)
    }
  })

  // Test control panel UI
  test('capture control panel interface', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Open control panel
    await page.click('button[aria-label="Open customization panel"]')
    await page.waitForTimeout(800)

    await page.screenshot({
      path: `screenshots/control-panel-open.png`,
      fullPage: false,
    })

    console.log('📸 Control panel UI captured')
  })

  // Test control panel with different states
  test('capture control panel states', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Open control panel
    await page.click('button[aria-label="Open customization panel"]')
    await page.waitForTimeout(800)

    // Capture with theme section visible
    await page.screenshot({
      path: `screenshots/control-panel-themes.png`,
      fullPage: false,
    })

    // Scroll to typography section
    await page.evaluate(() => {
      document
        .querySelector('[class*="panel"]')
        ?.scrollTo({ top: 400, behavior: 'smooth' })
    })
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `screenshots/control-panel-typography.png`,
      fullPage: false,
    })

    console.log('📸 Control panel states captured')
  })
})
