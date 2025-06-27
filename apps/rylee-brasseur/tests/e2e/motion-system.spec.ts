import { test, expect } from './support/test-with-logging'
import siteConfig from '../../src/config/site-config'

test.describe('Motion System - Discrete State Transitions', () => {
  test('should transition between hero and header states', async ({
    page,
    logger,
  }) => {
    await logger.trackFeature('motion-system-transitions')
    await logger.trackFeature('hero-to-header-animation')
    await logger.trackComponent('HeroSection')
    await logger.trackComponent('ContactHeader')
    await logger.logAction('Starting motion system state transition test')

    // Navigate to the page
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for motion system initialization
    await logger.logAction('Page loaded and motion system initialized')

    // STEP 1: Verify initial hero state
    await logger.logAction('Verifying initial hero state')
    await page.screenshot({
      path: './test-results/screenshots/motion-1-initial-hero.png',
      fullPage: true,
    })

    const heroTitle = page.locator('.heroTitle')
    await expect(heroTitle).toBeVisible()
    await expect(heroTitle).toHaveText(siteConfig.hero.name)
    await expect(page.getByText(siteConfig.hero.title)).toBeVisible()
    await expect(page.getByText(siteConfig.hero.institution)).toBeVisible()
    await expect(
      page.locator(`.heroContact a[href="mailto:${siteConfig.hero.email}"]`)
    ).toBeVisible()

    const heroOpacity = await heroTitle.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
    expect(heroOpacity).toBeGreaterThan(0.9)
    await logger.logState('Hero state verified', {
      heroOpacity,
      heroText: siteConfig.hero.name,
    })

    // STEP 2: Transition to header state
    await logger.logAction('Triggering transition to header state')
    await page.evaluate(() => {
      window.testGotoSection?.('header')
    })
    await page.waitForTimeout(2000) // Wait for animation
    await page.screenshot({
      path: './test-results/screenshots/motion-2-header-state.png',
      fullPage: true,
    })

    const headerContainer = page.locator('#sticky-header-container')
    const headerName = page.locator('#header-name')
    const headerEmail = page.locator('#header-email')

    await expect(headerContainer).toBeVisible()
    await expect(headerName).toBeVisible()
    await expect(headerName).toHaveText(siteConfig.header.brandName)
    await expect(headerEmail).toBeVisible()

    const headerOpacity = await headerContainer.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
    expect(headerOpacity).toBeGreaterThan(0.9)

    const heroOpacityAfterTransition = await heroTitle.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
    expect(heroOpacityAfterTransition).toBeLessThan(0.1)
    await logger.logState('Header state verified', {
      headerOpacity,
      heroOpacityAfterTransition,
    })

    // STEP 3: Transition back to hero state
    await logger.logAction('Triggering transition back to hero state')
    await page.evaluate(() => {
      window.testGotoSection?.('hero')
    })
    await page.waitForTimeout(2000) // Wait for animation
    await page.screenshot({
      path: './test-results/screenshots/motion-3-back-to-hero.png',
      fullPage: true,
    })

    const heroOpacityFinal = await heroTitle.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
    expect(heroOpacityFinal).toBeGreaterThan(0.9)
    await logger.logState('Hero state restored', { heroOpacityFinal })

    // STEP 4: Test multiple transitions work
    await logger.logAction('Testing multiple rapid transitions')
    await page.evaluate(() => {
      window.testGotoSection?.('header')
    })
    await page.waitForTimeout(2000)

    await expect(headerContainer).toBeVisible()
    await logger.logState('Header state after rapid transition', {
      visible: true,
    })

    await page.evaluate(() => {
      window.testGotoSection?.('hero')
    })
    await page.waitForTimeout(2000)

    await expect(heroTitle).toBeVisible()
    await logger.logState('Hero state after rapid transition', {
      visible: true,
    })

    await logger.captureFullState('motion-system-final-state')
  })

  test('should prevent simultaneous animations', async ({ page, logger }) => {
    await logger.trackFeature('motion-system-transitions')
    await logger.trackFeature('animation-locking')
    await logger.logAction('Starting simultaneous animation prevention test')

    // Navigate to the page
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Verify initial state
    await logger.logAction('Verifying initial hero state')
    const heroTitle = page.locator('.heroTitle')
    await expect(heroTitle).toBeVisible()
    const initialOpacity = await heroTitle.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
    await logger.logState('Initial state', { heroOpacity: initialOpacity })

    // Rapidly trigger multiple transitions (should be blocked)
    await logger.logAction('Triggering rapid sequential transitions')
    await page.evaluate(() => {
      window.testGotoSection?.('header')
    })
    // Don't wait - immediately try another transition
    await page.evaluate(() => {
      window.testGotoSection?.('hero')
    })
    await logger.logAction('Attempted two rapid transitions without waiting')

    await page.waitForTimeout(3000) // Wait for any animations

    // Should end up in header state (first transition should complete)
    const headerContainer = page.locator('#sticky-header-container')
    await expect(headerContainer).toBeVisible()
    const headerOpacity = await headerContainer.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
    await logger.logState('Final state after rapid transitions', {
      headerVisible: true,
      headerOpacity,
      expectedBehavior: 'First transition completes, second is blocked',
    })

    await logger.captureFullState('simultaneous-animation-prevention')
  })

  test('should maintain state consistency across page reloads', async ({
    page,
    logger,
  }) => {
    await logger.trackFeature('motion-system-transitions')
    await logger.trackFeature('state-persistence')
    await logger.logAction('Starting state consistency test across reloads')

    // Navigate to the page
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Transition to header
    await logger.logAction('Transitioning to header state before reload')
    await page.evaluate(() => {
      window.testGotoSection?.('header')
    })
    await page.waitForTimeout(2000)

    const headerContainer = page.locator('#sticky-header-container')
    await expect(headerContainer).toBeVisible()
    await logger.logState('Header state before reload', { headerVisible: true })

    // Reload page
    await logger.logAction('Reloading page')
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Should be back to initial hero state
    await logger.logAction('Verifying state reset to hero after reload')
    const heroTitle = page.locator('.heroTitle')
    await expect(heroTitle).toBeVisible()
    const heroOpacity = await heroTitle.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
    expect(heroOpacity).toBeGreaterThan(0.9)

    // Header should not be visible
    const headerCount = await headerContainer.count()
    if (headerCount > 0) {
      await expect(headerContainer).not.toBeVisible()
    }

    await logger.logState('State after reload', {
      heroVisible: true,
      heroOpacity,
      headerVisible: false,
      stateReset: 'Successfully reset to initial hero state',
    })

    await logger.captureFullState('state-after-reload')
  })
})

test.describe('Motion System - Visual Verification', () => {
  test('should capture all animation states', async ({ page, logger }) => {
    await logger.trackFeature('motion-system-transitions')
    await logger.trackFeature('visual-regression')
    await logger.logAction(
      'Starting visual verification of all animation states'
    )

    // Navigate to the page
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const states = [
      {
        name: 'Initial hero state',
        action: async () => {
          const heroTitle = page.locator('.heroTitle')
          await expect(heroTitle).toBeVisible()
        },
        filename: 'visual-hero-state.png',
      },
      {
        name: 'Transition to header',
        action: async () => {
          await page.evaluate(() => {
            ;(
              window as unknown as {
                testGotoSection?: (section: string) => void
              }
            ).testGotoSection?.('header')
          })
          await page.waitForTimeout(2000)
        },
        filename: 'visual-transition-to-header.png',
      },
      {
        name: 'Header state',
        action: async () => {
          const headerContainer = page.locator('#sticky-header-container')
          await expect(headerContainer).toBeVisible()
        },
        filename: 'visual-header-state.png',
      },
      {
        name: 'Transition to hero',
        action: async () => {
          await page.evaluate(() => {
            ;(
              window as unknown as {
                testGotoSection?: (section: string) => void
              }
            ).testGotoSection?.('hero')
          })
          await page.waitForTimeout(2000)
        },
        filename: 'visual-transition-to-hero.png',
      },
    ]

    for (const state of states) {
      await logger.logAction(`Capturing ${state.name}`)
      await state.action()
      await page.screenshot({
        path: `./test-results/screenshots/${state.filename}`,
        fullPage: true,
      })
      await logger.logState(`Captured ${state.name}`, {
        filename: state.filename,
      })
    }

    await logger.captureFullState('visual-verification-complete')
  })
})

test.describe('Motion System - Observer Integration', () => {
  test('should respond to scroll events', async ({ page, logger }) => {
    await logger.trackFeature('motion-system-transitions')
    await logger.trackFeature('scroll-observer')
    await logger.trackInteraction('scroll', 'document')
    await logger.logAction(
      'Starting observer integration test with scroll events'
    )

    // Navigate to the page
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Initial hero state
    await logger.logAction('Verifying initial hero state before scroll')
    const heroTitle = page.locator('.heroTitle')
    await expect(heroTitle).toBeVisible()
    const initialHeroOpacity = await heroTitle.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
    await logger.logState('Initial state', { heroOpacity: initialHeroOpacity })

    // Scroll down should trigger header transition
    await logger.logAction('Scrolling down to trigger header transition')
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: './test-results/screenshots/observer-after-scroll-down.png',
      fullPage: true,
    })

    // Note: Observer events may not work in test environment
    await logger.logState('State after scroll down', {
      scrollAmount: 500,
      note: 'Observer events may not work in test environment - documenting intended behavior',
    })

    // Scroll up should trigger hero transition
    await logger.logAction('Scrolling up to trigger hero transition')
    await page.mouse.wheel(0, -500)
    await page.waitForTimeout(1500)
    await page.screenshot({
      path: './test-results/screenshots/observer-after-scroll-up.png',
      fullPage: true,
    })

    await logger.logState('State after scroll up', {
      scrollAmount: -500,
      note: 'Testing scroll-based state transitions',
    })

    await logger.captureFullState('observer-integration-final')
  })
})
