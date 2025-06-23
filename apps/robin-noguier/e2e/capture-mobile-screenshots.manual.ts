import { test, devices } from '@playwright/test'

test.describe.configure({ mode: 'parallel' })

const themes = [
  { id: 'sunset', label: 'Sunset' },
  { id: 'cyberpunk', label: 'Cyber' },
  { id: 'att', label: 'AT&T' },
  { id: 'msu', label: 'MSU' },
]

// Font options available but not used in mobile screenshots to reduce test time
// const fonts = [
//   { label: 'Playfair Display', variable: '--font-serif-fashion' },
//   { label: 'Bodoni Moda', variable: '--font-serif-editorial' },
//   { label: 'Montserrat', variable: '--font-sans-modern' },
//   { label: 'Bebas Neue', variable: '--font-display-bold' },
// ]

const mobileDevices = [
  { name: 'iphone-14-pro', device: devices['iPhone 14 Pro'] },
  { name: 'pixel-7', device: devices['Pixel 7'] },
  { name: 'galaxy-s22', device: devices['Galaxy S22'] },
]

const scrollPositions = [0, 50, 100] // Less positions for mobile

test.describe('Mobile Portfolio Screenshots', () => {
  // Test each device type
  for (const mobile of mobileDevices) {
    test(`capture ${mobile.name} screenshots`, async ({ browser }) => {
      const context = await browser.newContext({
        ...mobile.device,
        // Override to ensure consistent screenshots
        locale: 'en-US',
        timezoneId: 'America/New_York',
      })
      const page = await context.newPage()

      // Navigate to the app
      await page.goto('http://localhost:5173/portfolio/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Capture each theme
      for (const theme of themes) {
        // Hide font switcher temporarily to avoid overlap
        await page.evaluate(() => {
          const fontSwitcher = document.querySelector('[class*="fontSwitcher"]')
          if (fontSwitcher) fontSwitcher.style.display = 'none'
        })

        // Select theme
        await page.click('[aria-label="Theme options"]')
        await page.waitForTimeout(300)
        await page.click(`[aria-label="Switch to ${theme.label} theme"]`)
        await page.waitForTimeout(1000)

        // Show font switcher again
        await page.evaluate(() => {
          const fontSwitcher = document.querySelector('[class*="fontSwitcher"]')
          if (fontSwitcher) fontSwitcher.style.display = ''
        })

        // Hero section (top of page)
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.waitForTimeout(500)

        await page.screenshot({
          path: `screenshots/mobile/${mobile.name}-${theme.id}-hero.png`,
          fullPage: false,
        })

        // With font switcher open
        await page.click('button[aria-label="Toggle font selector"]')
        await page.waitForTimeout(500)

        await page.screenshot({
          path: `screenshots/mobile/${mobile.name}-${theme.id}-font-switcher.png`,
          fullPage: false,
        })

        // Close font switcher by clicking the close button with the specific CSS class
        await page.click('button[class*="closeButton"]')
        await page.waitForTimeout(300)

        // Scroll positions
        for (const scrollPercent of scrollPositions) {
          const scrollHeight = await page.evaluate(
            () => document.documentElement.scrollHeight - window.innerHeight
          )
          const scrollTo = (scrollHeight * scrollPercent) / 100

          await page.evaluate((y) => {
            window.scrollTo({ top: y, behavior: 'smooth' })
          }, scrollTo)
          await page.waitForTimeout(1000)

          await page.screenshot({
            path: `screenshots/mobile/${mobile.name}-${theme.id}-scroll-${scrollPercent}.png`,
            fullPage: false,
          })
        }

        console.log(`📱 ${mobile.name} + ${theme.id} captured`)
      }

      await context.close()
    })
  }

  // Portrait vs Landscape comparison
  test('capture orientation comparison', async ({ browser }) => {
    const iPhone = devices['iPhone 14 Pro']

    // Portrait
    const portraitContext = await browser.newContext({
      ...iPhone,
      locale: 'en-US',
    })
    const portraitPage = await portraitContext.newPage()

    await portraitPage.goto('http://localhost:5173/portfolio/')
    await portraitPage.waitForLoadState('networkidle')
    await portraitPage.waitForTimeout(2000)

    await portraitPage.screenshot({
      path: `screenshots/mobile/iphone-portrait.png`,
      fullPage: false,
    })

    // Landscape
    const landscapeContext = await browser.newContext({
      ...iPhone,
      viewport: { width: 852, height: 393 }, // iPhone 14 Pro landscape
      locale: 'en-US',
    })
    const landscapePage = await landscapeContext.newPage()

    await landscapePage.goto('http://localhost:5173/portfolio/')
    await landscapePage.waitForLoadState('networkidle')
    await landscapePage.waitForTimeout(2000)

    await landscapePage.screenshot({
      path: `screenshots/mobile/iphone-landscape.png`,
      fullPage: false,
    })

    console.log('📱 Orientation comparison captured')

    await portraitContext.close()
    await landscapeContext.close()
  })

  // Full page mobile captures
  test('capture mobile full pages', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 14 Pro'],
      locale: 'en-US',
    })
    const page = await context.newPage()

    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Capture full page for two themes
    for (const theme of themes.slice(0, 2)) {
      // Hide font switcher temporarily
      await page.evaluate(() => {
        const fontSwitcher = document.querySelector('[class*="fontSwitcher"]')
        if (fontSwitcher) fontSwitcher.style.display = 'none'
      })

      await page.click('[aria-label="Theme options"]')
      await page.waitForTimeout(300)
      await page.click(`[aria-label="Switch to ${theme.label} theme"]`)
      await page.waitForTimeout(1000)

      // Show font switcher again
      await page.evaluate(() => {
        const fontSwitcher = document.querySelector('[class*="fontSwitcher"]')
        if (fontSwitcher) fontSwitcher.style.display = ''
      })

      await page.screenshot({
        path: `screenshots/mobile/iphone-${theme.id}-full-page.png`,
        fullPage: true,
      })

      console.log(`📱 Full page ${theme.id} captured`)
    }

    await context.close()
  })

  // Test mobile-specific interactions
  test('capture mobile interactions', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 14 Pro'],
      locale: 'en-US',
    })
    const page = await context.newPage()

    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Open control panel on mobile
    await page.click('button[aria-label="Open customization panel"]')
    await page.waitForTimeout(800)

    await page.screenshot({
      path: `screenshots/mobile/iphone-control-panel-open.png`,
      fullPage: false,
    })

    // Select a theme
    await page.click('[aria-label="Switch to MSU theme"]')
    await page.waitForTimeout(1000)

    // Scroll to typography section in control panel
    await page.evaluate(() => {
      document
        .querySelector('[class*="panel"]')
        ?.scrollTo({ top: 400, behavior: 'smooth' })
    })
    await page.waitForTimeout(500)

    await page.screenshot({
      path: `screenshots/mobile/iphone-msu-typography-options.png`,
      fullPage: false,
    })

    console.log('📱 Mobile interactions captured')

    await context.close()
  })

  // Tablet captures (iPad)
  test('capture tablet views', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro 11'],
      locale: 'en-US',
    })
    const page = await context.newPage()

    await page.goto('http://localhost:5173/portfolio/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    for (const theme of themes.slice(0, 2)) {
      // Hide font switcher temporarily
      await page.evaluate(() => {
        const fontSwitcher = document.querySelector('[class*="fontSwitcher"]')
        if (fontSwitcher) fontSwitcher.style.display = 'none'
      })

      await page.click('[aria-label="Theme options"]')
      await page.waitForTimeout(300)
      await page.click(`[aria-label="Switch to ${theme.label} theme"]`)
      await page.waitForTimeout(1000)

      // Show font switcher again
      await page.evaluate(() => {
        const fontSwitcher = document.querySelector('[class*="fontSwitcher"]')
        if (fontSwitcher) fontSwitcher.style.display = ''
      })

      await page.screenshot({
        path: `screenshots/mobile/ipad-${theme.id}.png`,
        fullPage: false,
      })
    }

    console.log('📱 Tablet views captured')

    await context.close()
  })
})
