import { test as base } from '@playwright/test'
import { EnhancedLogger } from './enhanced-logger'

// Extend the base test to include enhanced logging
export const test = base.extend<{
  logger: EnhancedLogger
}>({
  logger: async ({ page }, use, testInfo) => {
    console.log('\n' + '='.repeat(80))
    console.log(`[TEST START] ${testInfo.title}`)
    console.log(`[TEST FILE] ${testInfo.file}`)
    console.log(`[TEST TIME] ${new Date().toISOString()}`)
    console.log('='.repeat(80) + '\n')

    // Create enhanced logger
    const logger = new EnhancedLogger(page, testInfo, {
      enableCoverage: true,
      enableScreenshots: true,
      enableTracing: true,
      verboseLevel: 'verbose',
    })

    // Start coverage collection
    await logger.startCoverage()

    // Inject runtime logging into the page
    await page.addInitScript(() => {
      // Capture motion system state
      ;(
        window as unknown as {
          __motionState?: Record<string, unknown>
          __observerState?: Record<string, unknown>
        }
      ).__motionState = {}(
        window as unknown as {
          __motionState?: Record<string, unknown>
          __observerState?: Record<string, unknown>
        }
      ).__observerState = {}

      // Override console methods to add metadata
      const originalLog = console.log
      const originalError = console.error
      const originalWarn = console.warn

      console.log = (...args: unknown[]) => {
        const stack = new Error().stack
        const caller = stack?.split('\n')[2]?.trim() || 'unknown'
        originalLog('[Runtime Log]', ...args, `\n  at ${caller}`)
      }

      console.error = (...args: unknown[]) => {
        const stack = new Error().stack
        originalError('[Runtime Error]', ...args, `\n${stack}`)
      }

      console.warn = (...args: unknown[]) => {
        const stack = new Error().stack
        originalWarn(
          '[Runtime Warning]',
          ...args,
          `\n  at ${stack?.split('\n')[2]?.trim()}`
        )
      }

      // Log all events
      const events = [
        'scroll',
        'click',
        'keydown',
        'resize',
        'visibilitychange',
      ]
      events.forEach((eventType) => {
        window.addEventListener(
          eventType,
          (e) => {
            console.log(`[Event: ${eventType}]`, {
              timestamp: Date.now(),
              target: e.target?.tagName,
              scrollY: window.scrollY,
            })
          },
          { passive: true, capture: true }
        )
      })
    })

    // Provide the logger to the test
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(logger)

    // After test: collect coverage and save artifacts
    await logger.stopCoverage()
    await logger.saveTestArtifacts()

    console.log('\n' + '='.repeat(80))
    console.log(`[TEST END] ${testInfo.title}`)
    console.log(`[TEST STATUS] ${testInfo.status}`)
    console.log(`[TEST DURATION] ${testInfo.duration}ms`)
    console.log('='.repeat(80) + '\n')
  },
})

export { expect } from '@playwright/test'
