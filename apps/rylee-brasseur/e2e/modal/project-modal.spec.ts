import { test, expect } from '../support/test-with-logging'

test.describe('Project Detail Modal', () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.logAction('Setting up project modal test')
    await page.goto('/')
    await page.waitForSelector('canvas', { timeout: 10000 })
    await logger.logAction('Page loaded with WebGL canvas')
  })

  test('should open modal when clicking project button', async ({
    page,
    logger,
  }) => {
    await logger.logAction('Testing modal open functionality')

    // Click the first project button
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await logger.logAction('Clicking first project button')
    await firstProjectButton.click()

    // Check modal is visible
    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    await logger.logState('Modal visibility', { isVisible: true })

    // Check modal content
    const modalTitle = await page.locator('#modal-title')
    await expect(modalTitle).toBeVisible()
    await expect(modalTitle).toHaveText('UN Security Council Reform')

    await logger.logState('Modal content', {
      titleVisible: true,
      titleText: 'UN Security Council Reform',
    })

    await logger.captureFullState('modal-open-test')
  })

  test('should close modal when clicking close button', async ({
    page,
    logger,
  }) => {
    await logger.logAction('Testing modal close button functionality')

    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await logger.logAction('Opening modal by clicking project button')
    await firstProjectButton.click()

    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    await logger.logState('Modal opened', { isVisible: true })

    // Click close button with force to bypass any overlapping elements
    const closeButton = await page.locator('[aria-label="Close modal"]').first()
    await logger.logAction('Clicking close button')
    await closeButton.click({ force: true })

    // Modal should be hidden
    await expect(modal).not.toBeVisible()
    await logger.logState('Modal closed', { isVisible: false })

    await logger.captureFullState('modal-close-button-test')
  })

  test('should close modal when clicking overlay', async ({ page, logger }) => {
    await logger.logAction('Testing modal overlay close functionality')

    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await logger.logAction('Opening modal')
    await firstProjectButton.click()

    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    await logger.logState('Modal opened', { isVisible: true })

    // Click overlay (not the content) with force
    const overlay = await page.locator('[class*="overlay"]')
    await logger.logAction('Clicking overlay at position (10, 10)')
    await overlay.click({ position: { x: 10, y: 10 }, force: true })

    // Modal should be hidden
    await expect(modal).not.toBeVisible()
    await logger.logState('Modal closed via overlay', { isVisible: false })

    await logger.captureFullState('modal-overlay-close-test')
  })

  test('should close modal on Escape key', async ({ page, logger }) => {
    await logger.logAction('Testing modal Escape key close functionality')

    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await logger.logAction('Opening modal')
    await firstProjectButton.click()

    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    await logger.logState('Modal opened', { isVisible: true })

    // Press Escape
    await logger.logAction('Pressing Escape key')
    await page.keyboard.press('Escape')

    // Modal should be hidden
    await expect(modal).not.toBeVisible()
    await logger.logState('Modal closed via Escape', { isVisible: false })

    await logger.captureFullState('modal-escape-close-test')
  })

  test('should show correct project information', async ({ page, logger }) => {
    await logger.logAction('Testing modal project information display')

    // Click second project
    const secondProjectButton = await page
      .locator('[class*="projectButton"]')
      .nth(1)
    await logger.logAction('Clicking second project button')
    await secondProjectButton.click()

    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible()
    await logger.logState('Modal opened for second project', {
      isVisible: true,
    })

    // Check content
    const modalTitle = await page.locator('#modal-title')
    await expect(modalTitle).toHaveText('Climate Diplomacy in the Pacific')
    await logger.logState('Modal title', {
      text: 'Climate Diplomacy in the Pacific',
    })

    const category = await page.locator('[class*="category"]')
    await expect(category).toHaveText('Dissertation')
    await logger.logState('Project category', { text: 'Dissertation' })

    const year = await page.locator('[class*="year"]')
    await expect(year).toHaveText('2024')
    await logger.logState('Project year', { text: '2024' })

    await logger.logState('Project information summary', {
      title: 'Climate Diplomacy in the Pacific',
      category: 'Dissertation',
      year: '2024',
    })

    await logger.captureFullState('modal-project-info-test')
  })

  test('should prevent body scroll when modal is open', async ({
    page,
    logger,
  }) => {
    await logger.logAction('Testing body scroll prevention when modal is open')

    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await logger.logAction('Opening modal')
    await firstProjectButton.click()

    // Check body overflow is hidden
    const bodyOverflow = await page.evaluate(
      () => window.getComputedStyle(document.body).overflow
    )
    expect(bodyOverflow).toBe('hidden')
    await logger.logState('Body overflow with modal open', {
      overflow: bodyOverflow,
    })

    // Close modal
    await logger.logAction('Closing modal with Escape key')
    await page.keyboard.press('Escape')

    // Check body overflow is restored
    const bodyOverflowAfter = await page.evaluate(
      () => window.getComputedStyle(document.body).overflow
    )
    expect(bodyOverflowAfter).not.toBe('hidden')
    await logger.logState('Body overflow after modal close', {
      overflow: bodyOverflowAfter,
    })

    await logger.captureFullState('modal-scroll-prevention-test')
  })

  test('should be accessible', async ({ page, logger }) => {
    await logger.logAction('Testing modal accessibility features')

    // Open modal
    const firstProjectButton = await page
      .locator('[class*="projectButton"]')
      .first()
    await logger.logAction('Opening modal for accessibility test')
    await firstProjectButton.click()

    const modal = await page.locator('[role="dialog"]')

    // Check ARIA attributes
    await expect(modal).toHaveAttribute('aria-modal', 'true')
    await expect(modal).toHaveAttribute('aria-labelledby', 'modal-title')

    await logger.logState('Modal ARIA attributes', {
      hasAriaModal: true,
      ariaModalValue: 'true',
      hasAriaLabelledby: true,
      ariaLabelledbyValue: 'modal-title',
    })

    // Check close button has label
    const closeButton = await page.locator('button[aria-label="Close modal"]')
    await expect(closeButton).toBeVisible()

    await logger.logState('Close button accessibility', {
      hasAriaLabel: true,
      ariaLabel: 'Close modal',
      isVisible: true,
    })

    await logger.captureFullState('modal-accessibility-test')
  })
})
