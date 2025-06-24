import { Page, TestInfo } from '@playwright/test'
import { LogCollector } from './logCollector'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface EnhancedLoggerOptions {
  enableCoverage?: boolean
  enableScreenshots?: boolean
  enableTracing?: boolean
  verboseLevel?: 'minimal' | 'normal' | 'verbose' | 'debug'
}

export class EnhancedLogger {
  private logCollector: LogCollector
  private page: Page
  private testInfo: TestInfo
  private options: Required<EnhancedLoggerOptions>
  private coverage: any[] = []
  
  constructor(page: Page, testInfo: TestInfo, options: EnhancedLoggerOptions = {}) {
    this.page = page
    this.testInfo = testInfo
    this.logCollector = new LogCollector(page)
    this.options = {
      enableCoverage: true,
      enableScreenshots: true,
      enableTracing: true,
      verboseLevel: 'verbose',
      ...options
    }
    
    this.setupEnhancedLogging()
  }
  
  private setupEnhancedLogging() {
    // Intercept ALL browser console output
    this.page.on('console', async msg => {
      const type = msg.type()
      const text = msg.text()
      const location = msg.location()
      
      // Log to test runner console with source info
      const prefix = `[${type.toUpperCase()}]`
      const sourceInfo = location.url ? ` (${location.url}:${location.lineNumber})` : ''
      console.log(`${prefix} ${text}${sourceInfo}`)
      
      // Capture stack traces for errors
      if (type === 'error') {
        try {
          const args = await Promise.all(msg.args().map(arg => arg.jsonValue()))
          console.log('[ERROR DETAILS]', JSON.stringify(args, null, 2))
        } catch (e) {
          // Some errors can't be serialized
        }
      }
    })
    
    // Capture network failures
    this.page.on('requestfailed', request => {
      console.log(`[NETWORK FAILED] ${request.method()} ${request.url()}`)
      console.log(`[NETWORK FAILURE] ${request.failure()?.errorText}`)
    })
    
    // Capture page crashes
    this.page.on('crash', () => {
      console.error('[PAGE CRASHED] The page has crashed!')
    })
    
    // Capture dialog boxes
    this.page.on('dialog', async dialog => {
      console.log(`[DIALOG ${dialog.type()}] ${dialog.message()}`)
      await dialog.dismiss()
    })
  }
  
  async startCoverage() {
    if (!this.options.enableCoverage) return
    
    console.log('[Coverage] Starting JS coverage collection')
    await this.page.coverage.startJSCoverage({
      resetOnNavigation: false,
      reportAnonymousScripts: true
    })
  }
  
  async stopCoverage() {
    if (!this.options.enableCoverage) return
    
    const coverage = await this.page.coverage.stopJSCoverage()
    this.coverage = coverage
    
    console.log(`[Coverage] Collected coverage for ${coverage.length} files`)
    
    // Log coverage summary
    let totalBytes = 0
    let usedBytes = 0
    
    for (const entry of coverage) {
      if (!entry.text) continue // Skip entries without text
      
      const ranges = entry.ranges || []
      totalBytes += entry.text.length
      
      for (const range of ranges) {
        usedBytes += range.end - range.start
      }
    }
    
    const percentage = totalBytes > 0 ? (usedBytes / totalBytes * 100).toFixed(2) : 0
    console.log(`[Coverage] Overall coverage: ${percentage}% (${usedBytes}/${totalBytes} bytes)`)
    
    return coverage
  }
  
  async log(message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info') {
    const levels = ['minimal', 'normal', 'verbose', 'debug']
    const currentLevel = levels.indexOf(this.options.verboseLevel)
    const messageLevel = levels.indexOf(level === 'info' ? 'normal' : level)
    
    if (messageLevel <= currentLevel) {
      const timestamp = new Date().toISOString()
      const formatted = `[Test ${level.toUpperCase()}] ${timestamp} - ${message}`
      console.log(formatted)
    }
  }
  
  async logAction(action: string, details?: any) {
    await this.log(`ACTION: ${action}`, 'info')
    if (details && this.options.verboseLevel === 'verbose') {
      console.log('[ACTION DETAILS]', JSON.stringify(details, null, 2))
    }
  }
  
  async logState(stateName: string, state: any) {
    await this.log(`STATE: ${stateName}`, 'debug')
    if (this.options.verboseLevel === 'debug') {
      console.log('[STATE DETAILS]', JSON.stringify(state, null, 2))
    }
  }
  
  async captureFullState(label: string) {
    console.log(`[Full State Capture] ${label}`)
    
    // Capture screenshot
    if (this.options.enableScreenshots) {
      const screenshotPath = this.testInfo.outputPath(`state-${label}-${Date.now()}.png`)
      await this.page.screenshot({ path: screenshotPath, fullPage: true })
      console.log(`[Screenshot] Saved to ${screenshotPath}`)
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
        motionState: (window as any).__motionState || null,
        observerState: (window as any).__observerState || null
      }
    })
    
    console.log('[DOM State]', JSON.stringify(domState, null, 2))
    
    // Get current logs
    const logs = this.logCollector.getAllLogs()
    console.log(`[Log Count] ${logs.length} logs captured`)
    
    return {
      label,
      timestamp: new Date().toISOString(),
      domState,
      logCount: logs.length,
      coverage: this.coverage
    }
  }
  
  async saveTestArtifacts() {
    const artifactsDir = this.testInfo.outputPath('artifacts')
    await fs.mkdir(artifactsDir, { recursive: true })
    
    // Save all logs
    const logsPath = path.join(artifactsDir, 'browser-logs.json')
    await this.logCollector.saveLogs(logsPath)
    
    // Save coverage
    if (this.coverage.length > 0) {
      const coveragePath = path.join(artifactsDir, 'coverage.json')
      await fs.writeFile(coveragePath, JSON.stringify(this.coverage, null, 2))
      console.log(`[Coverage] Saved to ${coveragePath}`)
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
        coverage: this.coverage.length > 0 ? 'coverage.json' : null,
        screenshots: await fs.readdir(this.testInfo.outputDir).catch(() => [])
      }
    }
    
    await fs.writeFile(
      path.join(artifactsDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    )
    
    console.log(`[Test Artifacts] Saved to ${artifactsDir}`)
  }
}