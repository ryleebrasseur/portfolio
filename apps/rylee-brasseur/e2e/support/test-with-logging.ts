import { test as base } from '@playwright/test'
import { EnhancedLogger } from './enhanced-logger'

/**
 * Enhanced test fixture with conditional event logging
 *
 * Event logging can be controlled via the DEBUG_EVENTS environment variable:
 * - Not set or empty: No event logging (default, best performance)
 * - DEBUG_EVENTS=true or DEBUG_EVENTS=1: Log all events (scroll, click, keydown, resize, visibilitychange)
 * - DEBUG_EVENTS=click,scroll: Log only specific events (comma-separated list)
 *
 * Examples:
 *   pnpm test                                # No event logging
 *   DEBUG_EVENTS=true pnpm test              # Log all events
 *   DEBUG_EVENTS=click,scroll pnpm test      # Log only click and scroll events
 *
 * This eliminates the overhead of logging every scroll event during tests when not needed.
 */

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
    const debugEventsValue = process.env.DEBUG_EVENTS || ''

    await page.addInitScript((debugEvents) => {
      // Store listeners for cleanup
      ;(window as any).__testListeners = []
      ;(window as any).__eventListeners = []
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
        originalLog('[Runtime Log]', ...args)
      }

      console.error = (...args: unknown[]) => {
        const stack = new Error().stack
        originalError('[Runtime Error]', ...args, `\n${stack}`)
      }

      console.warn = (...args: unknown[]) => {
        // Only include stack trace in debug mode
        const logLevel = process.env.LOG_LEVEL || ''
        if (logLevel === 'debug') {
          const stack = new Error().stack
          originalWarn(
            '[Runtime Warning]',
            ...args,
            `\n  at ${stack?.split('\n')[2]?.trim()}`
          )
        } else {
          originalWarn('[Runtime Warning]', ...args)
        }
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

      // Conditionally add event logging based on DEBUG_EVENTS environment variable
      if (debugEvents) {
        const allEvents = [
          'scroll',
          'click',
          'keydown',
          'resize',
          'visibilitychange',
        ]

        // Determine which events to log
        let eventsToLog: string[] = []
        if (debugEvents === 'true' || debugEvents === '1') {
          // Log all events if DEBUG_EVENTS is just 'true'
          eventsToLog = allEvents
        } else {
          // Parse comma-separated list of specific events
          eventsToLog = debugEvents
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter((e) => allEvents.includes(e))
        }

        // Add event listeners only for specified events
        eventsToLog.forEach((eventType) => {
          const handler = (e: Event) => {
            let targetTag = 'unknown'
            if (e.target instanceof HTMLElement) {
              targetTag = e.target.tagName
            }
            console.log(`[Event: ${eventType}]`, {
              timestamp: Date.now(),
              target: targetTag,
              scrollY: window.scrollY,
            })
          }

          // Store reference for cleanup
          ;(window as any).__eventListeners.push({ eventType, handler })

          window.addEventListener(eventType, handler, {
            passive: true,
            capture: true,
          })
        })
      }
    }, debugEventsValue)

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

        // Clean up debug event listeners
        const eventListeners = (window as any).__eventListeners || []
        eventListeners.forEach(({ eventType, handler }: any) => {
          window.removeEventListener(eventType, handler, { capture: true })
        })
        delete (window as any).__eventListeners

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
