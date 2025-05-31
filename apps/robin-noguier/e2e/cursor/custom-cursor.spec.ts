import { test, expect } from '@playwright/test'

test.describe('Custom Cursor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should hide default cursor and show custom cursor', async ({
    page,
  }) => {
    // Check that body has cursor: none
    const bodyCursor = await page.evaluate(
      () => window.getComputedStyle(document.body).cursor
    )
    expect(bodyCursor).toBe('none')

    // Check custom cursor elements exist
    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )
    const cursorDot = await page.locator('[class*="cursorDot"]')

    await expect(cursor).toBeAttached()
    await expect(cursorDot).toBeAttached()
  })

  test('should follow mouse movement', async ({ page }) => {
    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )

    // Move mouse to center
    await page.mouse.move(500, 300)
    await page.waitForTimeout(200)

    // Get cursor position
    const transform1 = await cursor.evaluate(
      (el) => window.getComputedStyle(el).transform
    )

    // Move mouse to different position
    await page.mouse.move(700, 400)
    await page.waitForTimeout(200)

    const transform2 = await cursor.evaluate(
      (el) => window.getComputedStyle(el).transform
    )

    // Transforms should be different
    expect(transform1).not.toBe(transform2)
  })

  test('should change state on hover over interactive elements', async ({
    page,
  }) => {
    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )

    // Create a button to test hover
    await page.evaluate(() => {
      const button = document.createElement('button')
      button.textContent = 'Test Button'
      button.style.position = 'fixed'
      button.style.top = '50%'
      button.style.left = '50%'
      button.style.transform = 'translate(-50%, -50%)'
      button.style.padding = '20px'
      document.body.appendChild(button)
    })

    // Initial state - should not have hovering class
    const initialClasses = await cursor.getAttribute('class')
    expect(initialClasses).not.toContain('hovering')

    // Hover over button
    const button = await page.locator('button:has-text("Test Button")')
    await button.hover()
    await page.waitForTimeout(100)

    // Should have hovering class
    const hoverClasses = await cursor.getAttribute('class')
    expect(hoverClasses).toContain('hovering')

    // Move away
    await page.mouse.move(100, 100)
    await page.waitForTimeout(100)

    // Should not have hovering class
    const afterClasses = await cursor.getAttribute('class')
    expect(afterClasses).not.toContain('hovering')
  })

  test('should respond to click events', async ({ page }) => {
    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )

    // Initial state
    const initialClasses = await cursor.getAttribute('class')
    expect(initialClasses).not.toContain('clicking')

    // Mouse down
    await page.mouse.down()
    await page.waitForTimeout(50)

    const clickingClasses = await cursor.getAttribute('class')
    expect(clickingClasses).toContain('clicking')

    // Mouse up
    await page.mouse.up()
    await page.waitForTimeout(50)

    const releasedClasses = await cursor.getAttribute('class')
    expect(releasedClasses).not.toContain('clicking')
  })

  test('should be hidden on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()

    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )
    const cursorDot = await page.locator('[class*="cursorDot"]')

    // Should be hidden via CSS
    await expect(cursor).toHaveCSS('display', 'none')
    await expect(cursorDot).toHaveCSS('display', 'none')
  })

  test('should respect reduced motion preference', async ({
    page,
    context,
  }) => {
    // Create new context with reduced motion
    const newContext = await context.browser()?.newContext({
      reducedMotion: 'reduce',
    })
    if (!newContext) return

    const newPage = await newContext.newPage()
    await newPage.goto('/')

    // Custom cursor should not be rendered
    const cursor = await newPage.locator('[class*="cursor"]')
    await expect(cursor).toHaveCount(0)

    await newContext.close()
  })

  test('should handle hovering over non-element targets', async ({
    page,
    browserName,
  }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )

    // Set up error monitoring BEFORE any interactions
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // Add test elements
    await page.evaluate(() => {
      // Add a text node directly to body
      const textNode = document.createTextNode(' Some text content ')
      document.body.appendChild(textNode)

      // Add an SVG element
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '100')
      svg.setAttribute('height', '100')
      svg.style.position = 'fixed'
      svg.style.top = '200px'
      svg.style.left = '200px'
      document.body.appendChild(svg)
    })

    // WebKit needs more time
    if (browserName === 'webkit') {
      await page.waitForTimeout(500)
    }

    try {
      // Move mouse over document body (might trigger on text nodes)
      await page.mouse.move(50, 50, { steps: 5 })
      await page.waitForTimeout(100)

      // Hover over various areas with slower movements for WebKit
      await page.mouse.move(100, 100, { steps: 5 }) // Might hit text node
      await page.waitForTimeout(100)

      await page.mouse.move(250, 250, { steps: 5 }) // Over SVG
      await page.waitForTimeout(100)

      await page.mouse.move(10, 10, { steps: 5 }) // Document edge
      await page.waitForTimeout(200)
    } catch (error) {
      // If WebKit fails on mouse.move, check if it's the known page closed error
      if (browserName === 'webkit' && error.message.includes('Page closed')) {
        console.warn(
          'WebKit page closed during mouse movement - known WSL issue'
        )
        // Still check for the actual error we care about
        const typeErrors = errors.filter((e) =>
          e.includes('matches is not a function')
        )
        expect(typeErrors).toHaveLength(0)
        return
      }
      throw error
    }

    // Check no errors occurred
    const typeErrors = errors.filter((e) =>
      e.includes('matches is not a function')
    )
    expect(typeErrors).toHaveLength(0)
  })
})
