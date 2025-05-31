import { test, expect } from '@playwright/test'

test.describe('Project Navigation Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[class*="projectButton"]', { timeout: 10000 })
  })

  test('buttons should be clickable and open modal', async ({ page }) => {
    // Get first project button
    const firstButton = await page.locator('[class*="projectButton"]').first()

    // Check button is visible and enabled
    await expect(firstButton).toBeVisible()
    await expect(firstButton).toBeEnabled()

    // Click the button
    await firstButton.click()

    // Modal should appear
    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // Check modal has correct content
    const modalTitle = await page.locator('#modal-title')
    await expect(modalTitle).toHaveText('UN Security Council Reform')
  })

  test('buttons should have proper cursor styles', async ({ page }) => {
    const firstButton = await page.locator('[class*="projectButton"]').first()

    // Check cursor style (should be none for custom cursor)
    const cursorStyle = await firstButton.evaluate(
      (el) => window.getComputedStyle(el).cursor
    )
    expect(cursorStyle).toBe('none')

    // Check button is positioned correctly
    const position = await firstButton.evaluate(
      (el) => window.getComputedStyle(el).position
    )
    expect(['fixed', 'absolute', 'relative']).toContain(position)
  })

  test('custom cursor should not block button clicks', async ({ page }) => {
    // Track click events
    let buttonClicked = false
    await page.exposeFunction('buttonClicked', () => {
      buttonClicked = true
    })

    // Add click listener to button
    await page.evaluate(() => {
      const button = document.querySelector('[class*="projectButton"]')
      button?.addEventListener('click', () => {
        ;(window as any).buttonClicked()
      })
    })

    // Get button position
    const button = await page.locator('[class*="projectButton"]').first()
    const box = await button.boundingBox()

    if (box) {
      // Click in center of button
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)

      // Wait a bit for event to fire
      await page.waitForTimeout(100)

      // Check button was clicked
      expect(buttonClicked).toBe(true)
    }
  })

  test('hovering should show custom cursor hover state', async ({ page }) => {
    const button = await page.locator('[class*="projectButton"]').first()
    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )

    // Initial state - no hover
    let cursorClasses = await cursor.getAttribute('class')
    expect(cursorClasses).not.toContain('hovering')

    // Hover over button
    await button.hover()
    await page.waitForTimeout(100)

    // Should have hover state
    cursorClasses = await cursor.getAttribute('class')
    expect(cursorClasses).toContain('hovering')

    // Move away
    await page.mouse.move(10, 10)
    await page.waitForTimeout(100)

    // Should not have hover state
    cursorClasses = await cursor.getAttribute('class')
    expect(cursorClasses).not.toContain('hovering')
  })

  test('all project buttons should be functional', async ({ page }) => {
    const buttons = await page.locator('[class*="projectButton"]').all()

    expect(buttons.length).toBe(5) // We have 5 projects

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]

      // Click button
      await button.click()

      // Modal should open
      const modal = await page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()

      // Close modal
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()

      // Small delay before next iteration
      await page.waitForTimeout(200)
    }
  })
})
