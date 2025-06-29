import { test, expect } from '@playwright/test'

test.describe('Accordion Projects', () => {
  test('accessibility and animations work correctly', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForTimeout(2000)

    // Scroll to accordion section
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(1000)

    // Check that accordion is visible
    const accordion = page.locator('[role="button"][aria-expanded]').first()
    await expect(accordion).toBeVisible()

    // Check initial state - first item should be expanded
    await expect(accordion).toHaveAttribute('aria-expanded', 'true')

    // Check that other items are collapsed
    const secondItem = page.locator('[role="button"][aria-expanded]').nth(1)
    await expect(secondItem).toHaveAttribute('aria-expanded', 'false')

    // Hover over second item
    await secondItem.hover()
    await page.waitForTimeout(700) // Wait for animation

    // Check that second item is now expanded
    await expect(secondItem).toHaveAttribute('aria-expanded', 'true')
    await expect(accordion).toHaveAttribute('aria-expanded', 'false')

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/accordion-hover-state.png',
      fullPage: false,
    })
  })

  test('scroll indicator hides after scrolling', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000) // Wait for animations

    // Check that scroll indicator is visible initially
    const scrollIndicator = page.getByText('Scroll / Drag to explore')
    await expect(scrollIndicator).toBeVisible()

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 100))
    await page.waitForTimeout(500)

    // Check that scroll indicator is hidden
    await expect(scrollIndicator).not.toBeVisible()
  })
})
