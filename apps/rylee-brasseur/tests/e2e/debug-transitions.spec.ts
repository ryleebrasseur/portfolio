import { test, expect } from './support/test-with-logging'

test('debug single transition to header', async ({ page, logger }) => {
  await logger.logAction('Starting single transition debug test')

  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')

  // Wait for initial hero state
  await page.waitForSelector('.heroTitle', { state: 'visible' })
  await logger.logAction('Initial hero state loaded')

  // Log initial state
  const initialIndex = await page.evaluate(
    () =>
      (window as unknown as { currentIndexRef?: { current?: number } })
        .currentIndexRef?.current ?? 'undefined'
  )
  await logger.logState('Initial currentIndex', { currentIndex: initialIndex })

  // Inject logging into page context before transition
  await page.evaluate(() => {
    // Add transition event listeners
    const originalTestGotoSection = (
      window as unknown as { testGotoSection?: (section: string) => unknown }
    ).testGotoSection
    if (originalTestGotoSection) {
      ;(
        window as unknown as { testGotoSection?: (section: string) => unknown }
      ).testGotoSection = (section: string) => {
        console.log(
          `[Transition] Calling testGotoSection with section: ${section}`
        )
        console.log(
          '[Transition] currentIndexRef before:',
          (window as unknown as { currentIndexRef?: unknown }).currentIndexRef
        )
        const result = originalTestGotoSection(section)
        console.log('[Transition] testGotoSection result:', result)
        console.log(
          '[Transition] currentIndexRef after:',
          (window as unknown as { currentIndexRef?: unknown }).currentIndexRef
        )
        return result
      }
    }
  })

  // Trigger transition to header
  await logger.logAction('Triggering transition to header section')
  await page.evaluate(() => {
    const result = (
      window as unknown as { testGotoSection?: (section: string) => unknown }
    ).testGotoSection?.('header')
    return result
  })

  // Wait longer for animation
  await page.waitForTimeout(2000)
  await logger.logAction('Waited for animation to complete')

  // Check if header is visible
  const headerExists = await page.locator('#sticky-header-container').count()
  await logger.logState('Header DOM existence', {
    exists: headerExists > 0,
    count: headerExists,
  })

  const headerVisible = await page
    .locator('#sticky-header-container')
    .isVisible()
  await logger.logState('Header visibility', { visible: headerVisible })

  const headerOpacity = await page
    .locator('#sticky-header-container')
    .evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        opacity: styles.opacity,
        display: styles.display,
        visibility: styles.visibility,
        transform: styles.transform,
        zIndex: styles.zIndex,
      }
    })
  await logger.logState('Header computed styles', headerOpacity)

  // Check hero state
  const heroStyles = await page.locator('.heroTitle').evaluate((el) => {
    const styles = window.getComputedStyle(el)
    return {
      opacity: styles.opacity,
      display: styles.display,
      visibility: styles.visibility,
      transform: styles.transform,
    }
  })
  await logger.logState('Hero computed styles after transition', heroStyles)

  // Check final currentIndex
  const finalIndex = await page.evaluate(
    () =>
      (window as unknown as { currentIndexRef?: { current?: number } })
        .currentIndexRef?.current ?? 'undefined'
  )
  await logger.logState('Final currentIndex', { currentIndex: finalIndex })

  // Take screenshot for debugging
  await page.screenshot({ path: 'test-results/debug-header-transition.png' })
  await logger.logAction('Captured transition result screenshot')

  // Verify transition success
  expect(headerVisible).toBe(true)
  await logger.logState('Transition test result', {
    success: headerVisible,
    expectedHeaderVisible: true,
    actualHeaderVisible: headerVisible,
  })

  await logger.captureFullState('single-transition-debug-complete')
})
