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
      enableScreenshots: true,
      enableTracing: true,
      verboseLevel: 'verbose',
    })

    // Inject runtime logging into the page
    await page.addInitScript(() => {
      // Store listeners for cleanup
      ;(window as any).__testListeners = []
      ;(window as any).__originalConsoleMethods = {
        log: console.log,
        error: console.error,
        warn: console.warn,
      }

      // Capture motion system state
      ;(
        window as unknown as {
          __motionState?: Record<string, unknown>
          __observerState?: Record<string, unknown>
        }
      ).__motionState = {}
      ;(
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

      // Override addEventListener to track listeners
      const originalAddEventListener = window.addEventListener.bind(window)
      window.addEventListener = function (
        event: string,
        handler: EventListenerOrEventListenerObject,
        ...args: any[]
      ) {
        ;(window as any).__testListeners.push({ event, handler, args })
        return originalAddEventListener(event, handler, ...args)
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
            let targetTag = 'unknown'
            if (e.target instanceof HTMLElement) {
              targetTag = e.target.tagName
            }
            console.log(`[Event: ${eventType}]`, {
              timestamp: Date.now(),
              target: targetTag,
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

    // After test: save artifacts
    await logger.saveTestArtifacts()

    // Clean up window event listeners
    await page
      .evaluate(() => {
        // Clean up event listeners
        const listeners = (window as any).__testListeners || []
        listeners.forEach(({ event, handler, args }: any) => {
          window.removeEventListener(event, handler, ...args)
        })
        delete (window as any).__testListeners

        // Restore original console methods
        const originalMethods = (window as any).__originalConsoleMethods
        if (originalMethods) {
          console.log = originalMethods.log
          console.error = originalMethods.error
          console.warn = originalMethods.warn
          delete (window as any).__originalConsoleMethods
        }

        // Clean up test state
        delete (window as any).__motionState
        delete (window as any).__observerState
      })
      .catch(() => {
        // Page might be closed already, ignore errors
      })

    console.log('\n' + '='.repeat(80))
    console.log(`[TEST END] ${testInfo.title}`)
    console.log(`[TEST STATUS] ${testInfo.status}`)
    console.log(`[TEST DURATION] ${testInfo.duration}ms`)
    console.log('='.repeat(80) + '\n')
  },
})

export { expect } from '@playwright/test'
