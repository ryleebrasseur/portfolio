import { test, expect } from '@playwright/test'

test.describe('Hero Section with WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('canvas', { timeout: 10000 })
  })

  test('should render the WebGL canvas', async ({ page }) => {
    const canvas = await page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Check canvas has proper dimensions
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox?.width).toBeGreaterThan(0)
    expect(canvasBox?.height).toBeGreaterThan(0)
  })

  test('should display hero title and subtitle', async ({ page }) => {
    const title = await page.locator('h1:has-text("Rylee Brasseur")')
    const subtitle = await page.locator('text=International Relations Student')
    const institution = await page.locator('text=Michigan State University')

    await expect(title).toBeVisible()
    await expect(subtitle).toBeVisible()
    await expect(institution).toBeVisible()
  })

  test('should respond to scroll interactions', async ({ page }) => {
    // Get initial position of overlay content
    const overlayContent = await page.locator('.overlayContent')
    const initialBox = await overlayContent.boundingBox()

    // Scroll down
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(1000)

    // Verify page has scrolled
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBeGreaterThan(0)
  })

  test('should have proper scroll height based on projects', async ({
    page,
  }) => {
    const heroContainer = await page.locator('[class*="heroContainer"]')
    const containerHeight = await heroContainer.evaluate(
      (el) => el.scrollHeight
    )

    // Should be approximately 500vh (5 projects * 100vh)
    const viewportHeight = await page.evaluate(() => window.innerHeight)
    expect(containerHeight).toBeGreaterThan(viewportHeight * 4)
  })

  test('should be responsive', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    let title = await page.locator('h1')
    let titleFontSize = await title.evaluate(
      (el) => window.getComputedStyle(el).fontSize
    )
    const desktopFontSize = parseFloat(titleFontSize)

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    titleFontSize = await title.evaluate(
      (el) => window.getComputedStyle(el).fontSize
    )
    const mobileFontSize = parseFloat(titleFontSize)

    // Font size should be smaller on mobile
    expect(mobileFontSize).toBeLessThan(desktopFontSize)
  })
})
