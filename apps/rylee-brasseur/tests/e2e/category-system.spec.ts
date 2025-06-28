import { test, expect } from '@playwright/test'

test.describe('Category System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    // Wait for hero section to load
    await page.waitForSelector('[data-testid="hero-section"]', {
      timeout: 10000,
    })

    // Click button to show category system
    await page.click('text=Show Category System')
  })

  test('should display category navigation', async ({ page }) => {
    // Check that category nav is visible
    const categoryNav = page.locator('nav').first()
    await expect(categoryNav).toBeVisible()

    // Check all category buttons are present
    await expect(page.locator('button:has-text("Posters")')).toBeVisible()
    await expect(
      page.locator('button:has-text("Graphic Design")')
    ).toBeVisible()
    await expect(
      page.locator('button:has-text("Market Research")')
    ).toBeVisible()
    await expect(
      page.locator('button:has-text("Video Production")')
    ).toBeVisible()
    await expect(page.locator('button:has-text("AAF")')).toBeVisible()
  })

  test('should show posters category by default', async ({ page }) => {
    // Check that posters content is visible
    await expect(page.locator('h1:has-text("Gallery Wall")')).toBeVisible()
    await expect(
      page.locator('text=A collection of visual storytelling')
    ).toBeVisible()
  })

  test('should switch between categories', async ({ page }) => {
    // Click on Graphic Design category
    await page.click('text=Graphic Design')

    // Check that content changed
    await expect(
      page.locator('h1:has-text("Design Case Studies")')
    ).toBeVisible()

    // Click on Video Production
    await page.click('text=Video Production')

    // Check theme changed (background should be dark for video)
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'video-theme')
  })

  test('should display posters in grid', async ({ page }) => {
    // Wait for posters grid
    const postersGrid = page.locator('.postersGrid')
    await expect(postersGrid).toBeVisible()

    // Check that we have poster items
    const posters = page.locator('.posterWrapper')
    await expect(posters).toHaveCount(1) // Based on test data
  })

  test('should toggle between masonry and grid layout', async ({ page }) => {
    // Check masonry is default
    const postersGrid = page.locator('.postersGrid')
    await expect(postersGrid).toHaveClass(/masonry/)

    // Click grid button
    await page.click('text=Grid')

    // Check grid layout is applied
    await expect(postersGrid).toHaveClass(/grid/)
  })
})
