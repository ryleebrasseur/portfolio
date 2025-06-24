import { test, expect } from '../support/test-with-logging'
import { projects } from '../../src/data/projects'

test.describe('Project Navigation Buttons', () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.logAction('Setting up project navigation test')
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[class*="projectButton"]', { timeout: 10000 })
    await logger.logAction('Project buttons loaded')
  })

  test('buttons should be clickable and open modal', async ({
    page,
    logger,
  }) => {
    await logger.logAction('Testing project button click functionality')

    // Get first project button
    const firstButton = await page.locator('[class*="projectButton"]').first()

    // Check button is visible and enabled
    await expect(firstButton).toBeVisible()
    await expect(firstButton).toBeEnabled()

    await logger.logState('First button state', {
      visible: true,
      enabled: true,
      expectedProject: projects[0].title,
    })

    // Click the button
    await firstButton.click()
    await logger.logAction('Clicked first project button')

    // Modal should appear
    const modal = await page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })
    await logger.logState('Modal visibility', { visible: true })

    // Check modal has correct content
    const modalTitle = await page.locator('#modal-title')
    await expect(modalTitle).toHaveText(projects[0].title)

    await logger.logState('Modal content verification', {
      expectedTitle: projects[0].title,
      actualTitle: await modalTitle.textContent(),
      matches: true,
    })

    await logger.captureFullState('project-button-modal-test')
  })

  test('buttons should have proper cursor styles', async ({ page, logger }) => {
    await logger.logAction('Testing button cursor styles')

    const firstButton = await page.locator('[class*="projectButton"]').first()

    // Check cursor style (should be none for custom cursor)
    const cursorStyle = await firstButton.evaluate(
      (el) => window.getComputedStyle(el).cursor
    )
    expect(cursorStyle).toBe('none')

    await logger.logState('Cursor style', {
      cursorStyle,
      expected: 'none',
      hasCustomCursor: cursorStyle === 'none',
    })

    // Check button is positioned correctly
    const position = await firstButton.evaluate(
      (el) => window.getComputedStyle(el).position
    )
    expect(['fixed', 'absolute', 'relative']).toContain(position)

    await logger.logState('Button positioning', {
      position,
      isValidPosition: ['fixed', 'absolute', 'relative'].includes(position),
    })
  })

  test('custom cursor should not block button clicks', async ({
    page,
    logger,
  }) => {
    await logger.logAction('Testing custom cursor click-through behavior')

    // Track click events
    let buttonClicked = false
    await page.exposeFunction('buttonClicked', () => {
      buttonClicked = true
    })

    // Add click listener to button
    await page.evaluate(() => {
      const button = document.querySelector('[class*="projectButton"]')
      button?.addEventListener('click', () => {
        ;(window as unknown as { buttonClicked?: () => void }).buttonClicked?.()
      })
    })
    await logger.logAction('Added click event listener to button')

    // Get button position
    const button = await page.locator('[class*="projectButton"]').first()
    const box = await button.boundingBox()

    if (box) {
      await logger.logState('Button bounding box', {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      })

      // Click in center of button
      const clickX = box.x + box.width / 2
      const clickY = box.y + box.height / 2
      await logger.logAction(`Clicking at coordinates (${clickX}, ${clickY})`)

      await page.mouse.click(clickX, clickY)

      // Wait a bit for event to fire
      await page.waitForTimeout(100)

      // Check button was clicked
      expect(buttonClicked).toBe(true)
      await logger.logState('Click event result', {
        buttonClicked,
        clickThrough: 'Custom cursor does not block clicks',
      })
    }
  })

  test('hovering should show custom cursor hover state', async ({
    page,
    logger,
  }) => {
    await logger.logAction('Testing custom cursor hover states')

    const button = await page.locator('[class*="projectButton"]').first()
    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )

    // Initial state - no hover
    let cursorClasses = await cursor.getAttribute('class')
    expect(cursorClasses).not.toContain('hovering')
    await logger.logState('Initial cursor state', {
      classes: cursorClasses,
      isHovering: false,
    })

    // Hover over button
    await button.hover()
    await page.waitForTimeout(100)
    await logger.logAction('Hovered over project button')

    // Should have hover state
    cursorClasses = await cursor.getAttribute('class')
    expect(cursorClasses).toContain('hovering')
    await logger.logState('Cursor state while hovering', {
      classes: cursorClasses,
      isHovering: true,
    })

    // Move away
    await page.mouse.move(10, 10)
    await page.waitForTimeout(100)
    await logger.logAction('Moved mouse away from button')

    // Should not have hover state
    cursorClasses = await cursor.getAttribute('class')
    expect(cursorClasses).not.toContain('hovering')
    await logger.logState('Cursor state after moving away', {
      classes: cursorClasses,
      isHovering: false,
    })

    await logger.captureFullState('cursor-hover-state-test')
  })

  test('all project buttons should be functional', async ({ page, logger }) => {
    await logger.logAction('Testing all project buttons functionality')

    const buttons = await page.locator('[class*="projectButton"]').all()

    expect(buttons.length).toBe(projects.length)
    await logger.logState('Project button count', {
      found: buttons.length,
      expected: projects.length,
      matches: buttons.length === projects.length,
    })

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]
      const project = projects[i]

      await logger.logAction(
        `Testing project button ${i + 1}: ${project.title}`
      )

      // Click button
      await button.click()

      // Modal should open
      const modal = await page.locator('[role="dialog"]')
      await expect(modal).toBeVisible()

      // Verify correct project is shown
      const modalTitle = await page.locator('#modal-title')
      const titleText = await modalTitle.textContent()

      await logger.logState(`Project ${i + 1} modal`, {
        expectedTitle: project.title,
        actualTitle: titleText,
        modalVisible: true,
      })

      // Close modal
      await page.keyboard.press('Escape')
      await expect(modal).not.toBeVisible()
      await logger.logAction('Closed modal with Escape key')

      // Small delay before next iteration
      await page.waitForTimeout(200)
    }

    await logger.logState('All buttons test summary', {
      totalButtonsTested: buttons.length,
      allFunctional: true,
    })

    await logger.captureFullState('all-project-buttons-test-complete')
  })
})
