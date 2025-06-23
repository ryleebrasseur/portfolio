import { test, devices } from '@playwright/test'

test.describe.configure({ mode: 'parallel' })

// Essential combinations only
const essentialThemes = [
  { id: 'sunset', label: 'Sunset' }, // Default theme
  { id: 'att', label: 'AT&T' }, // Corporate/professional
  { id: 'cyberpunk', label: 'Cyber' }, // High contrast alternative
]

const essentialFonts = [
  { label: 'Playfair Display', type: 'serif' }, // Elegant serif
  { label: 'Montserrat', type: 'sans' }, // Modern sans
]

const essentialDevices = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'iphone', device: devices['iPhone 14 Pro'] },
  { name: 'android', device: devices['Pixel 7'] },
]

test.describe('Essential Portfolio Screenshots', () => {
  // Desktop hero shots with theme/font combinations
  test('capture desktop hero variations', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    for (const theme of essentialThemes) {
      // Open control panel
      await page.click('button[aria-label="Open customization panel"]')
      await page.waitForTimeout(500)

      // Select theme
      await page.click(`[aria-label="Switch to ${theme.label} theme"]`)
      await page.waitForTimeout(1000)

      // Select first font (serif)
      await page.click(`button:has-text("${essentialFonts[0].label}")`)
      await page.waitForTimeout(500)

      // Close panel
      await page.click('button[aria-label="Close panel"]')
      await page.waitForTimeout(500)

      // Hero screenshot
      await page.screenshot({
        path: `screenshots/essential/${theme.id}-hero-serif.png`,
        fullPage: false,
      })

      // Quick font switch to sans
      await page.click('button[aria-label="Open customization panel"]')
      await page.waitForTimeout(300)
      await page.click(`button:has-text("${essentialFonts[1].label}")`)
      await page.waitForTimeout(300)
      await page.click('button[aria-label="Close panel"]')
      await page.waitForTimeout(500)

      await page.screenshot({
        path: `screenshots/essential/${theme.id}-hero-sans.png`,
        fullPage: false,
      })

      console.log(`📸 ${theme.id} hero variations captured`)
    }
  })

  // Key UI states
  test('capture UI states', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Control panel open
    await page.click('button[aria-label="Open customization panel"]')
    await page.waitForTimeout(800)

    await page.screenshot({
      path: `screenshots/essential/control-panel.png`,
      fullPage: false,
    })

    // Close and capture one scrolled view
    await page.click('button[aria-label="Close panel"]')
    await page.waitForTimeout(500)

    // Scroll to content
    await page.evaluate(() => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight
      window.scrollTo({ top: scrollHeight * 0.5, behavior: 'smooth' })
    })
    await page.waitForTimeout(1500)

    await page.screenshot({
      path: `screenshots/essential/content-view.png`,
      fullPage: false,
    })

    console.log('📸 UI states captured')
  })

  // Mobile hero shots - one theme, both devices
  test('capture mobile views', async ({ browser }) => {
    for (const device of essentialDevices.slice(1)) {
      // Skip desktop
      const context = await browser.newContext({
        ...device.device,
        locale: 'en-US',
      })
      const page = await context.newPage()

      await page.goto('http://localhost:5173/portfolio/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Default theme hero
      await page.screenshot({
        path: `screenshots/essential/${device.name}-hero.png`,
        fullPage: false,
      })

      // One alternate theme
      await page.click('button[aria-label="Open customization panel"]')
      await page.waitForTimeout(500)
      await page.click('[aria-label="Switch to AT&T theme"]')
      await page.waitForTimeout(1000)
      await page.click('button[aria-label="Close panel"]')
      await page.waitForTimeout(500)

      await page.screenshot({
        path: `screenshots/essential/${device.name}-att.png`,
        fullPage: false,
      })

      await context.close()
      console.log(`📱 ${device.name} captured`)
    }
  })

  // One full page capture
  test('capture full page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: `screenshots/essential/full-page.png`,
      fullPage: true,
    })

    console.log('📸 Full page captured')
  })
})
