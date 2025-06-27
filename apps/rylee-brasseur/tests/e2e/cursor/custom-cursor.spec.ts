import { test, expect } from '../support/test-with-logging'

test.describe('Custom Cursor', () => {
  test.beforeEach(async ({ page, logger }) => {
    await logger.logAction('Setting up custom cursor test')
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForLoadState('networkidle')
    await logger.logAction('Page loaded and ready for cursor testing')
  })

  test('should hide default cursor and show custom cursor', async ({
    page,
    logger,
  }) => {
    await logger.trackFeature('custom-cursor')
    await logger.trackComponent('CustomCursor')
    await logger.logAction(
      'Testing default cursor hide and custom cursor display'
    )

    // Check that body has cursor: none
    const bodyCursor = await page.evaluate(
      () => window.getComputedStyle(document.body).cursor
    )
    expect(bodyCursor).toBe('none')
    await logger.logState('Body cursor style', { cursor: bodyCursor })

    // Check custom cursor elements exist
    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )
    const cursorDot = await page.locator('[class*="cursorDot"]')

    await expect(cursor).toBeAttached()
    await expect(cursorDot).toBeAttached()

    await logger.logState('Custom cursor elements', {
      cursorAttached: true,
      cursorDotAttached: true,
    })

    await logger.captureFullState('cursor-visibility-test')
  })

  test('should follow mouse movement', async ({ page, logger }) => {
    await logger.trackFeature('custom-cursor')
    await logger.trackComponent('CustomCursor')
    await logger.trackInteraction('mousemove', 'document')
    await logger.logAction('Testing cursor movement tracking')

    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )

    // Move mouse to center
    await logger.logAction('Moving mouse to center (500, 300)')
    await page.mouse.move(500, 300)
    await page.waitForTimeout(200)

    // Get cursor position
    const transform1 = await cursor.evaluate(
      (el) => window.getComputedStyle(el).transform
    )
    await logger.logState('First cursor position', { transform: transform1 })

    // Move mouse to different position
    await logger.logAction('Moving mouse to new position (700, 400)')
    await page.mouse.move(700, 400)
    await page.waitForTimeout(200)

    const transform2 = await cursor.evaluate(
      (el) => window.getComputedStyle(el).transform
    )
    await logger.logState('Second cursor position', { transform: transform2 })

    // Transforms should be different
    expect(transform1).not.toBe(transform2)

    await logger.logState('Movement test result', {
      positionsAreDifferent: transform1 !== transform2,
    })

    await logger.captureFullState('cursor-movement-test')
  })

  test('should change state on hover over interactive elements', async ({
    page,
    logger,
  }) => {
    await logger.trackFeature('custom-cursor')
    await logger.trackComponent('CustomCursor')
    await logger.trackFeature('hover-states')
    await logger.logAction('Testing cursor hover state changes')

    // Wait for cursor to be ready
    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )
    await expect(cursor).toBeAttached()

    // Test with email link instead of project buttons
    await logger.logAction('Waiting for email link to be visible')
    await page.waitForTimeout(2000) // Give time for animations
    const emailLink = await page.locator('a[href^="mailto:"]').first()
    await expect(emailLink).toBeVisible()

    // Move mouse to a neutral position first
    await logger.logAction('Moving mouse to neutral position (50, 50)')
    await page.mouse.move(50, 50)
    await page.waitForTimeout(100)

    // Initial state - should not have hovering class
    const initialClasses = await cursor.getAttribute('class')
    expect(initialClasses).toMatch(/cursor/)
    expect(initialClasses).not.toMatch(/hovering/)
    await logger.logState('Initial cursor state', {
      classes: initialClasses,
      hasHoveringClass: false,
    })

    // Hover over email link
    await logger.logAction('Hovering over email link')
    await emailLink.hover()
    await page.waitForTimeout(100)

    // Should have hovering class (CSS module class contains 'hovering')
    const hoverClasses = await cursor.getAttribute('class')
    expect(hoverClasses).toMatch(/hovering/)
    await logger.logState('Hover cursor state', {
      classes: hoverClasses,
      hasHoveringClass: true,
    })

    // Move away
    await logger.logAction('Moving mouse away from link')
    await page.mouse.move(50, 50)
    await page.waitForTimeout(100)

    // Should not have hovering class
    const afterClasses = await cursor.getAttribute('class')
    expect(afterClasses).not.toMatch(/hovering/)
    await logger.logState('After hover cursor state', {
      classes: afterClasses,
      hasHoveringClass: false,
    })

    await logger.captureFullState('cursor-hover-test')
  })

  test('should respond to click events', async ({ page, logger }) => {
    await logger.trackFeature('custom-cursor')
    await logger.trackComponent('CustomCursor')
    await logger.trackInteraction('click', 'document')
    await logger.logAction('Testing cursor click state')

    const cursor = await page.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )

    // Initial state
    const initialClasses = await cursor.getAttribute('class')
    expect(initialClasses).not.toMatch(/clicking/)
    await logger.logState('Initial click state', {
      classes: initialClasses,
      hasClickingClass: false,
    })

    // Mouse down
    await logger.logAction('Mouse down event')
    await page.mouse.down()
    await page.waitForTimeout(100)

    const clickingClasses = await cursor.getAttribute('class')
    expect(clickingClasses).toMatch(/clicking/)
    await logger.logState('Clicking state', {
      classes: clickingClasses,
      hasClickingClass: true,
    })

    // Mouse up
    await logger.logAction('Mouse up event')
    await page.mouse.up()
    await page.waitForTimeout(100)

    const releasedClasses = await cursor.getAttribute('class')
    expect(releasedClasses).not.toMatch(/clicking/)
    await logger.logState('Released state', {
      classes: releasedClasses,
      hasClickingClass: false,
    })

    await logger.captureFullState('cursor-click-test')
  })

  test('should be hidden on mobile devices', async ({ context, logger }) => {
    await logger.trackFeature('custom-cursor')
    await logger.trackFeature('responsive-design')
    await logger.logAction('Testing cursor visibility on mobile devices')

    // Create a new context with mobile viewport to ensure media queries apply correctly
    const mobileContext = await context.browser()?.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    })
    if (!mobileContext) {
      await logger.logAction('Could not create mobile context')
      return
    }

    const mobilePage = await mobileContext.newPage()
    await logger.logAction('Created mobile page with touch capabilities')

    await mobilePage.goto('/', { waitUntil: 'domcontentloaded' })
    await mobilePage.waitForLoadState('networkidle')

    const cursor = await mobilePage.locator(
      '[class*="cursor"]:not([class*="cursorDot"])'
    )
    const cursorDot = await mobilePage.locator('[class*="cursorDot"]')

    // Should be hidden via CSS
    await expect(cursor).toHaveCSS('display', 'none')
    await expect(cursorDot).toHaveCSS('display', 'none')

    await logger.logState('Mobile cursor visibility', {
      cursorDisplay: 'none',
      cursorDotDisplay: 'none',
      isMobile: true,
      viewport: { width: 375, height: 667 },
    })

    await mobileContext.close()
    await logger.captureFullState('cursor-mobile-test')
  })

  test('should respect reduced motion preference', async ({
    context,
    logger,
  }) => {
    await logger.trackFeature('custom-cursor')
    await logger.trackFeature('accessibility')
    await logger.trackFeature('reduced-motion')
    await logger.logAction('Testing cursor with reduced motion preference')

    // Create new context with reduced motion
    const newContext = await context.browser()?.newContext({
      reducedMotion: 'reduce',
    })
    if (!newContext) {
      await logger.logAction('Could not create reduced motion context')
      return
    }

    const newPage = await newContext.newPage()
    await logger.logAction('Created page with reduced motion preference')

    await newPage.goto('/')

    // Custom cursor should not be rendered
    const cursor = await newPage.locator('[class*="cursor"]')
    await expect(cursor).toHaveCount(0)

    await logger.logState('Reduced motion cursor state', {
      cursorCount: 0,
      reducedMotion: true,
    })

    await newContext.close()
    await logger.captureFullState('cursor-reduced-motion-test')
  })

  test('should handle hovering over non-element targets', async ({
    page,
    browserName,
    logger,
  }) => {
    await logger.trackFeature('custom-cursor')
    await logger.trackFeature('error-handling')
    await logger.logAction('Testing cursor behavior over non-element targets')

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Cursor element exists but is not directly used in this test
    await page.locator('[class*="cursor"]:not([class*="cursorDot"])')

    // Set up error monitoring BEFORE any interactions
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
      logger.logAction(`Page error detected: ${error.message}`)
    })

    // Add test elements
    await logger.logAction('Adding test elements (text node and SVG)')
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
      await logger.logAction('Waiting extra time for WebKit')
      await page.waitForTimeout(500)
    }

    try {
      // Move mouse over document body (might trigger on text nodes)
      await logger.logAction('Moving mouse to (50, 50) - document body')
      await page.mouse.move(50, 50, { steps: 5 })
      await page.waitForTimeout(100)

      // Hover over various areas with slower movements for WebKit
      await logger.logAction('Moving mouse to (100, 100) - might hit text node')
      await page.mouse.move(100, 100, { steps: 5 })
      await page.waitForTimeout(100)

      await logger.logAction('Moving mouse to (250, 250) - over SVG')
      await page.mouse.move(250, 250, { steps: 5 })
      await page.waitForTimeout(100)

      await logger.logAction('Moving mouse to (10, 10) - document edge')
      await page.mouse.move(10, 10, { steps: 5 })
      await page.waitForTimeout(200)
    } catch (error) {
      // If WebKit fails on mouse.move, check if it's the known page closed error
      if (
        browserName === 'webkit' &&
        error instanceof Error &&
        error.message.includes('Page closed')
      ) {
        await logger.logAction(
          'WebKit page closed during mouse movement - known WSL issue'
        )
        // Still check for the actual error we care about
        const typeErrors = errors.filter((e) =>
          e.includes('matches is not a function')
        )
        expect(typeErrors).toHaveLength(0)
        await logger.logState('Error check result', {
          totalErrors: errors.length,
          typeErrors: typeErrors.length,
          webkitIssue: true,
        })
        return
      }
      throw error
    }

    // Check no errors occurred
    const typeErrors = errors.filter((e) =>
      e.includes('matches is not a function')
    )
    expect(typeErrors).toHaveLength(0)

    await logger.logState('Non-element hover test result', {
      totalErrors: errors.length,
      typeErrors: typeErrors.length,
      browserName,
    })

    await logger.captureFullState('cursor-non-element-test')
  })
})
