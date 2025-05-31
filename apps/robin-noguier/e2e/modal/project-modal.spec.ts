import { test, expect } from '@playwright/test'

test.describe('Project Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('canvas', { timeout: 10000 })
  })

  test('should open modal when clicking project button', async ({ page }) => {
    // Click the first project button
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await firstProjectButton.click()

    // Check modal is visible
    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Check modal content
    const modalTitle = await page.locator('#modal-title')
    await expect(modalTitle).toBeVisible()
    await expect(modalTitle).toHaveText('UN Security Council Reform')
  })

  test('should close modal when clicking close button', async ({ page }) => {
    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await firstProjectButton.click()

    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Click close button with force to bypass any overlapping elements
    const closeButton = await page.locator('[aria-label="Close modal"]').first()
    await closeButton.click({ force: true })

    // Modal should be hidden
    await expect(modal).not.toBeVisible()
  })

  test('should close modal when clicking overlay', async ({ page }) => {
    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await firstProjectButton.click()

    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Click overlay (not the content) with force
    const overlay = await page.locator('[class*="overlay"]')
    await overlay.click({ position: { x: 10, y: 10 }, force: true })

    // Modal should be hidden
    await expect(modal).not.toBeVisible()
  })

  test('should close modal on Escape key', async ({ page }) => {
    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await firstProjectButton.click()

    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')

    // Modal should be hidden
    await expect(modal).not.toBeVisible()
  })

  test('should show correct project information', async ({ page }) => {
    // Click second project
    const secondProjectButton = await page
      .locator('[class*="projectButton"]')
      .nth(1)
    await secondProjectButton.click()

    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()

    // Check content
    const modalTitle = await page.locator('#modal-title')
    await expect(modalTitle).toHaveText('Climate Diplomacy in the Pacific')

    const category = await page.locator('[class*="category"]')
    await expect(category).toHaveText('Dissertation')

    const year = await page.locator('[class*="year"]')
    await expect(year).toHaveText('2024')
  })

  test('should prevent body scroll when modal is open', async ({ page }) => {
    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await firstProjectButton.click()

    // Check body overflow is hidden
    const bodyOverflow = await page.evaluate(
      () => window.getComputedStyle(document.body).overflow
    )
    expect(bodyOverflow).toBe('hidden')

    // Close modal
    await page.keyboard.press('Escape')

    // Check body overflow is restored
    const bodyOverflowAfter = await page.evaluate(
      () => window.getComputedStyle(document.body).overflow
    )
    expect(bodyOverflowAfter).not.toBe('hidden')
  })

  test('should be accessible', async ({ page }) => {
    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await firstProjectButton.click()

    const modal = await page.locator('[role="dialog"]')

    // Check ARIA attributes
    await expect(modal).toHaveAttribute('aria-modal', 'true')
    await expect(modal).toHaveAttribute('aria-labelledby', 'modal-title')

    // Check close button has label
    const closeButton = await page.locator('button[aria-label="Close modal"]')
    await expect(closeButton).toBeVisible()
  })
})
