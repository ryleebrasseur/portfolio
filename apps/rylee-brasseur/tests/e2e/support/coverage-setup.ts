import { chromium, FullConfig } from '@playwright/test'
import * as fs from 'fs/promises'
import * as path from 'path'

export default async function globalSetup(config: FullConfig) {
  console.log('[Coverage Setup] Starting global setup')

  // Create coverage directory
  const coverageDir = path.join(process.cwd(), 'coverage-temp')
  await fs.mkdir(coverageDir, { recursive: true })

  // Create browser console logs directory
  const logsDir = path.join(process.cwd(), 'browser-logs')
  await fs.mkdir(logsDir, { recursive: true })

  console.log('[Coverage Setup] Created directories:')
  console.log(`  - Coverage: ${coverageDir}`)
  console.log(`  - Browser logs: ${logsDir}`)

  // Start a browser to pre-compile/instrument code
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Enable coverage collection
  await page.coverage.startJSCoverage({
    resetOnNavigation: false,
    reportAnonymousScripts: true,
  })

  // Navigate to trigger initial compilation
  await page.goto(config.projects[0].use.baseURL || 'http://localhost:5173')
  await page.waitForTimeout(1000)

  // Stop coverage and save initial state
  const coverage = await page.coverage.stopJSCoverage()
  await fs.writeFile(
    path.join(coverageDir, 'initial-coverage.json'),
    JSON.stringify(coverage, null, 2)
  )

  await browser.close()

  console.log('[Coverage Setup] Initial instrumentation complete')
  console.log(`[Coverage Setup] Saved ${coverage.length} coverage entries`)

  return () => {
    console.log('[Coverage Teardown] Cleaning up')
  }
}
