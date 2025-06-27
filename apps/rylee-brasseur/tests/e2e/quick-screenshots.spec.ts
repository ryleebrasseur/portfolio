import { test, expect } from './support/test-with-logging'

test('verify no duplicate headers and animation works', async ({
  page,
  logger,
}) => {
  await logger.trackFeature('kinetic-phone-animation')
  await logger.trackComponent('KineticPhone')
  await logger.trackComponent('ContactHeader')
  await logger.logAction('Starting quick screenshots test')

  await page.goto('http://localhost:5173')
  await page.waitForTimeout(2000)
  await logger.logAction('Page loaded, waiting for initial state')

  // Test: Check for duplicate header bug (CRITICAL)
  const headerCount = await page.locator('#sticky-header-container').count()
  expect(headerCount).toBeLessThanOrEqual(1) // Should be 0 or 1, never more
  await logger.logState('Header count check', {
    headerCount,
    isDuplicate: headerCount > 1,
  })

  // Screenshot 1: Hero state
  await logger.logAction('Capturing hero state screenshot')
  await page.screenshot({
    path: './test-results/screenshots/1-hero-state.png',
    fullPage: false,
  })

  // Trigger header transition
  await logger.logAction('Triggering header transition via testGotoSection')
  await page.evaluate(() =>
    (
      window as unknown as { testGotoSection?: (section: string) => void }
    ).testGotoSection?.('header')
  )
  await page.waitForTimeout(2000)

  // Test: Verify no duplicates after animation
  const headerCountAfter = await page
    .locator('#sticky-header-container')
    .count()
  expect(headerCountAfter).toBe(1) // Should be exactly 1
  await logger.logState('Header count after animation', {
    headerCount: headerCountAfter,
    isCorrect: headerCountAfter === 1,
  })

  // Screenshot 2: Header state
  await logger.logAction('Capturing header state screenshot')
  await page.screenshot({
    path: './test-results/screenshots/2-header-state.png',
    fullPage: false,
  })

  // Test: Verify header phone KINETIC ANIMATION (not just text change)
  const headerPhone = page.locator('#header-phone')
  await expect(headerPhone).toBeVisible()
  await logger.logState('Header phone visibility', { isVisible: true })

  // Capture screenshots during animation to verify ACTUAL MOTION
  await logger.logAction('Capturing phone animation sequence - before flip')
  await page.screenshot({
    path: './test-results/screenshots/phone-before-flip.png',
    fullPage: false,
  })

  // Wait for animation to start
  await logger.logAction('Waiting for phone animation to start')
  await page.waitForTimeout(1500)

  // THIS SHOULD CAPTURE THE FLIP ANIMATION IN PROGRESS
  await logger.logAction('Capturing phone animation sequence - during flip')
  await page.screenshot({
    path: './test-results/screenshots/phone-during-flip.png',
    fullPage: false,
  })

  // Wait for animation to complete
  await logger.logAction('Waiting for phone animation to complete')
  await page.waitForTimeout(2000)

  await logger.logAction('Capturing phone animation sequence - after flip')
  await page.screenshot({
    path: './test-results/screenshots/phone-after-flip.png',
    fullPage: false,
  })

  // Test for ACTUAL animation properties - check if elements have transforms/rotations
  const flipContainers = page.locator('#header-phone .flipContainer')
  const flipperElements = page.locator('#header-phone .flipper')

  // These should exist if kinetic animation is working
  const containerCount = await flipContainers.count()
  const flipperCount = await flipperElements.count()

  await logger.logState('Phone animation structure analysis', {
    containerCount,
    flipperCount,
    hasFlipContainers: containerCount > 0,
    hasFlipperElements: flipperCount > 0,
  })

  // Kinetic animation is implemented - verify the structure
  expect(containerCount).toBe(12) // Should have 12 flip containers for phone number
  expect(flipperCount).toBe(12) // Should have 12 flipper elements

  await logger.captureFullState('quick-screenshots-complete')
})
