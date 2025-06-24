import { test, expect } from '../support/test-with-logging'
import siteConfig from '../../src/config/site-config.json' assert { type: 'json' }

test.describe('Hero Section with WebGL', () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.logAction('Setting up hero section test')
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('canvas', { timeout: 10000 })
    await logger.logAction('Hero section loaded with WebGL canvas')
  })

  test('should render the WebGL canvas', async ({ page, logger }) => {
    await logger.logAction('Testing WebGL canvas rendering')

    const canvas = await page.locator('canvas')
    await expect(canvas).toBeVisible()
    await logger.logState('Canvas visibility', { visible: true })

    // Check canvas has proper dimensions
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox?.width).toBeGreaterThan(0)
    expect(canvasBox?.height).toBeGreaterThan(0)

    await logger.logState('Canvas dimensions', {
      width: canvasBox?.width,
      height: canvasBox?.height,
      hasValidDimensions: canvasBox
        ? canvasBox.width > 0 && canvasBox.height > 0
        : false,
    })

    // Check WebGL context
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return false
      try {
        const gl =
          (canvas as HTMLCanvasElement).getContext('webgl') ||
          (canvas as HTMLCanvasElement).getContext('experimental-webgl')
        return !!gl
      } catch {
        return false
      }
    })

    await logger.logState('WebGL context', { hasWebGL })
    await logger.captureFullState('webgl-canvas-test')
  })

  test('should display hero title and subtitle', async ({ page, logger }) => {
    await logger.logAction('Testing hero text content')

    const title = await page.locator(`h1:has-text("${siteConfig.hero.name}")`)
    const subtitle = await page.locator(`text=${siteConfig.hero.title}`)
    const institution = await page.locator(
      `text=${siteConfig.hero.institution}`
    )

    await expect(title).toBeVisible()
    await expect(subtitle).toBeVisible()
    await expect(institution).toBeVisible()

    await logger.logState('Hero text content verification', {
      titleVisible: true,
      titleText: siteConfig.hero.name,
      subtitleVisible: true,
      subtitleText: siteConfig.hero.title,
      institutionVisible: true,
      institutionText: siteConfig.hero.institution,
    })

    // Check text styling
    const titleStyles = await title.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        color: styles.color,
      }
    })

    await logger.logState('Title styling', titleStyles)
  })

  test('should respond to scroll interactions', async ({ page, logger }) => {
    await logger.logAction('Testing scroll interactions')

    // Wait for overlay content to be ready
    const overlayContent = await page.locator('.overlayContent')
    await expect(overlayContent).toBeVisible()
    const initialBox = await overlayContent.boundingBox()

    await logger.logState('Initial overlay position', {
      x: initialBox?.x,
      y: initialBox?.y,
      width: initialBox?.width,
      height: initialBox?.height,
    })

    // Capture initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY)
    await logger.logState('Initial scroll position', {
      scrollY: initialScrollY,
    })

    // Scroll down
    await logger.logAction('Scrolling down 500px')
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(1000)

    // Verify page has scrolled
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBeGreaterThan(0)

    await logger.logState('After scroll', {
      scrollY,
      scrollDelta: scrollY - initialScrollY,
      scrollSuccessful: scrollY > 0,
    })

    await logger.captureFullState('scroll-interaction-test')
  })

  test('should have proper scroll height based on projects', async ({
    page,
    logger,
  }) => {
    await logger.logAction('Testing scroll height calculation')

    const heroContainer = await page.locator('[class*="heroContainer"]')
    const containerHeight = await heroContainer.evaluate(
      (el) => el.scrollHeight
    )

    // Should be approximately 500vh (5 projects * 100vh)
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    const expectedMinHeight = viewportHeight * 4

    expect(containerHeight).toBeGreaterThan(expectedMinHeight)

    await logger.logState('Scroll height analysis', {
      containerHeight,
      viewportHeight,
      expectedMinHeight,
      ratio: containerHeight / viewportHeight,
      meetsExpectation: containerHeight > expectedMinHeight,
    })
  })

  test('should be responsive', async ({ page, logger }) => {
    await logger.logAction('Testing responsive behavior')

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500) // Wait for viewport change
    await logger.logAction('Set viewport to desktop size (1920x1080)')

    const title = await page.locator('h1')
    await expect(title).toBeVisible()
    let titleFontSize = await title.evaluate(
      (el) => window.getComputedStyle(el).fontSize
    )
    const desktopFontSize = parseFloat(titleFontSize)

    await logger.logState('Desktop title styling', {
      fontSize: titleFontSize,
      parsedSize: desktopFontSize,
    })

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    await logger.logAction('Set viewport to mobile size (375x667)')

    titleFontSize = await title.evaluate(
      (el) => window.getComputedStyle(el).fontSize
    )
    const mobileFontSize = parseFloat(titleFontSize)

    await logger.logState('Mobile title styling', {
      fontSize: titleFontSize,
      parsedSize: mobileFontSize,
    })

    // Font size should be smaller on mobile
    expect(mobileFontSize).toBeLessThan(desktopFontSize)

    await logger.logState('Responsive test result', {
      desktopFontSize,
      mobileFontSize,
      difference: desktopFontSize - mobileFontSize,
      isResponsive: mobileFontSize < desktopFontSize,
    })

    await logger.captureFullState('responsive-test-complete')
  })
})
