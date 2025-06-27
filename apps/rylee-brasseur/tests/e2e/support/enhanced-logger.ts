import { Page, TestInfo } from '@playwright/test'
import { LogCollector } from './logCollector'
import { TestCoverageTracker } from './test-coverage-tracker'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface EnhancedLoggerOptions {
  enableScreenshots?: boolean
  enableTracing?: boolean
  verboseLevel?: 'minimal' | 'normal' | 'verbose' | 'debug'
}

export class EnhancedLogger {
  private logCollector: LogCollector
  private coverageTracker: TestCoverageTracker
  private page: Page
  private testInfo: TestInfo
  private options: Required<EnhancedLoggerOptions>
  private pageEventHandlers: Array<{
    event: string
    handler: (...args: any[]) => void
  }> = []
  private readonly logLevel: string
  private readonly coverageEnabled: boolean

  constructor(
    page: Page,
    testInfo: TestInfo,
    options: EnhancedLoggerOptions = {}
  ) {
    this.page = page
    this.testInfo = testInfo
    this.logCollector = new LogCollector(page)
    this.coverageTracker = new TestCoverageTracker()
    this.options = {
      enableScreenshots: true,
      enableTracing: true,
      verboseLevel: 'verbose',
      ...options,
    }
    this.logLevel = process.env.LOG_LEVEL || 'error'
    this.coverageEnabled = process.env.COLLECT_COVERAGE === 'true'

    this.setupEnhancedLogging()
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug']
    const currentLevel = levels.indexOf(this.logLevel.toLowerCase())
    const messageLevel = levels.indexOf(level.toLowerCase())
    return (
      currentLevel >= 0 && messageLevel >= 0 && messageLevel <= currentLevel
    )
  }

  private setupEnhancedLogging() {
    // Track route changes
    this.page.on('framenavigated', (frame) => {
      if (frame === this.page.mainFrame() && this.coverageEnabled) {
        this.coverageTracker.trackRoute(frame.url())
      }
    })

    // Intercept ALL browser console output
    this.page.on('console', async (msg) => {
      const type = msg.type()
      const text = msg.text()
      const location = msg.location()

      // Map console types to log levels
      const levelMap: Record<string, string> = {
        log: 'debug',
        info: 'info',
        warn: 'warn',
        error: 'error',
        debug: 'debug',
        trace: 'debug',
      }
      const logLevel = levelMap[type] || 'info'

      // Only output if meets log level threshold
      if (this.shouldLog(logLevel)) {
        // Log to test runner console with source info
        const prefix = `[${type.toUpperCase()}]`
        const sourceInfo = location.url
          ? ` (${location.url}:${location.lineNumber})`
          : ''
        console.log(`${prefix} ${text}${sourceInfo}`)
      }

      // Track interactions from console logs
      if (
        this.coverageEnabled &&
        (text.includes('INTERACTION:') || text.includes('ACTION:'))
      ) {
        const matches = text.match(
          /INTERACTION:\s*(\w+)\s*on\s*(.+)|ACTION:\s*(\w+)\s*(.+)/
        )
        if (matches) {
          const actionType = matches[1] || matches[3] || 'unknown'
          const selector = matches[2] || matches[4] || 'unknown'
          this.coverageTracker.trackInteraction(actionType, selector)
        }
      }

      // Track components from console logs
      if (
        this.coverageEnabled &&
        (text.includes('COMPONENT:') || text.includes('Component rendered:'))
      ) {
        const componentMatch = text.match(
          /COMPONENT:\s*(.+)|Component rendered:\s*(.+)/
        )
        if (componentMatch) {
          const componentName = componentMatch[1] || componentMatch[2]
          this.coverageTracker.trackComponent(componentName.trim())
        }
      }

      // Capture stack traces for errors
      if (type === 'error') {
        try {
          const args = await Promise.all(
            msg.args().map((arg) => arg.jsonValue())
          )
          if (this.shouldLog('error')) {
            console.log('[ERROR DETAILS]', JSON.stringify(args, null, 2))
          }
        } catch {
          // Some errors can't be serialized
        }
      }
    })

    // Capture network failures
    this.page.on('requestfailed', (request) => {
      if (this.shouldLog('warn')) {
        console.log(`[NETWORK FAILED] ${request.method()} ${request.url()}`)
        console.log(`[NETWORK FAILURE] ${request.failure()?.errorText}`)
      }
    })

    // Capture page crashes
    this.page.on('crash', () => {
      if (this.shouldLog('error')) {
        console.error('[PAGE CRASHED] The page has crashed!')
      }
    })

    // Capture dialog boxes
    this.page.on('dialog', async (dialog) => {
      if (this.shouldLog('warn')) {
        console.log(`[DIALOG ${dialog.type()}] ${dialog.message()}`)
      }
      await dialog.dismiss()
    })
  }

  async log(
    message: string,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info'
  ) {
    if (!this.shouldLog(level)) return

    const levels = ['minimal', 'normal', 'verbose', 'debug']
    const currentLevel = levels.indexOf(this.options.verboseLevel)
    const messageLevel = levels.indexOf(level === 'info' ? 'normal' : level)

    if (messageLevel <= currentLevel) {
      const timestamp = new Date().toISOString()
      const formatted = `[Test ${level.toUpperCase()}] ${timestamp} - ${message}`
      console.log(formatted)
    }
  }

  async logAction(action: string, details?: unknown) {
    await this.log(`ACTION: ${action}`, 'info')
    if (
      details &&
      this.options.verboseLevel === 'verbose' &&
      this.shouldLog('debug')
    ) {
      console.log('[ACTION DETAILS]', JSON.stringify(details, null, 2))
    }
  }

  async logState(stateName: string, state: unknown) {
    await this.log(`STATE: ${stateName}`, 'debug')
    if (this.options.verboseLevel === 'debug' && this.shouldLog('debug')) {
      console.log('[STATE DETAILS]', JSON.stringify(state, null, 2))
    }
  }

  async trackFeature(feature: string) {
    if (this.coverageEnabled) {
      this.coverageTracker.trackFeature(feature)
    }
    await this.log(`FEATURE: ${feature}`, 'debug')
  }

  async trackComponent(component: string) {
    if (this.coverageEnabled) {
      this.coverageTracker.trackComponent(component)
    }
    await this.log(`COMPONENT: ${component}`, 'debug')
  }

  async trackInteraction(type: string, selector: string) {
    if (this.coverageEnabled) {
      this.coverageTracker.trackInteraction(type, selector)
    }
    await this.log(`INTERACTION: ${type} on ${selector}`, 'debug')
  }

  async captureFullState(label: string) {
    if (this.shouldLog('info')) {
      console.log(`[Full State Capture] ${label}`)
    }

    // Capture screenshot
    if (this.options.enableScreenshots) {
      const screenshotPath = this.testInfo.outputPath(
        `state-${label}-${Date.now()}.png`
      )
      await this.page.screenshot({ path: screenshotPath, fullPage: true })
      if (this.shouldLog('debug')) {
        console.log(`[Screenshot] Saved to ${screenshotPath}`)
      }
    }

    // Capture DOM state
    const domState = await this.page.evaluate(() => {
      return {
        url: window.location.href,
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        bodyHeight: document.body.scrollHeight,
        bodyWidth: document.body.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        // Capture motion system state
        motionState:
          (window as unknown as { __motionState?: unknown }).__motionState ||
          null,
        observerState:
          (window as unknown as { __observerState?: unknown })
            .__observerState || null,
      }
    })

    if (this.shouldLog('debug')) {
      console.log('[DOM State]', JSON.stringify(domState, null, 2))
    }

    // Get current logs
    const logs = this.logCollector.getAllLogs()
    if (this.shouldLog('info')) {
      console.log(`[Log Count] ${logs.length} logs captured`)
    }

    // Get coverage information
    const coverage = this.coverageEnabled
      ? this.coverageTracker.generateSummary()
      : null
    if (this.coverageEnabled && this.shouldLog('debug')) {
      console.log('[Coverage Summary]', JSON.stringify(coverage, null, 2))
    }

    return {
      label,
      timestamp: new Date().toISOString(),
      domState,
      logCount: logs.length,
      coverage,
    }
  }

  async saveTestArtifacts() {
    const artifactsDir = this.testInfo.outputPath('artifacts')
    await fs.mkdir(artifactsDir, { recursive: true })

    // Save all logs
    const logsPath = path.join(artifactsDir, 'browser-logs.json')
    await this.logCollector.saveLogs(logsPath)

    // Save test coverage
    let coveragePath: string | undefined
    if (this.coverageEnabled) {
      coveragePath = path.join(artifactsDir, 'test-coverage.json')
      const coverageSummary = this.coverageTracker.generateSummary()
      await fs.writeFile(coveragePath, JSON.stringify(coverageSummary, null, 2))
    }

    // Save test metadata
    const metadata = {
      testTitle: this.testInfo.title,
      testFile: this.testInfo.file,
      duration: this.testInfo.duration,
      status: this.testInfo.status,
      errors: this.testInfo.errors,
      artifacts: {
        logs: logsPath,
        ...(coveragePath && { coverage: coveragePath }),
        screenshots: await fs.readdir(this.testInfo.outputDir).catch(() => []),
      },
    }

    await fs.writeFile(
      path.join(artifactsDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    )

    if (this.shouldLog('info')) {
      console.log(`[Test Artifacts] Saved to ${artifactsDir}`)
    }
  }

  getCoverageTracker() {
    return this.coverageTracker
  }

  resetCoverage() {
    if (this.coverageEnabled) {
      this.coverageTracker.reset()
    }
  }
}
