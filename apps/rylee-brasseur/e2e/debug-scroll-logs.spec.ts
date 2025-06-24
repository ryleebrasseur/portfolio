import { test, expect } from './support/test-with-logging'

test('capture scroll debug logs', async ({ page, logger }) => {
  await logger.logAction('Starting scroll debug log capture test')

  // Capture console logs with specific prefixes
  const capturedLogs: { timestamp: string; text: string; type: string }[] = []
  page.on('console', (msg) => {
    const text = msg.text()
    if (
      text.includes('[HTML]') ||
      text.includes('[ORCHESTRATOR]') ||
      text.includes('Observer:')
    ) {
      capturedLogs.push({
        timestamp: new Date().toISOString(),
        text,
        type: msg.type(),
      })
    }
  })

  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await logger.logAction('Page loaded for scroll log testing')

  // Capture initial scroll position
  const initialScroll = await page.evaluate(() => window.scrollY)
  await logger.logState('Initial scroll position', { scrollY: initialScroll })

  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(100)

  const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
  const afterScrollPosition = await page.evaluate(() => window.scrollY)

  await logger.logState('Before refresh state', {
    scrollHeight,
    scrollPosition: afterScrollPosition,
    capturedLogsCount: capturedLogs.length,
  })

  // Log all captured logs before refresh
  await logger.logState('Logs before refresh', capturedLogs)

  // Store logs before clearing
  const logsBeforeRefresh = [...capturedLogs]
  capturedLogs.length = 0 // Clear logs

  // REFRESH
  await logger.logAction('Refreshing page')
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // Give time for all logs

  await logger.logState('After refresh state', {
    capturedLogsCount: capturedLogs.length,
  })

  // Log all captured logs after refresh
  await logger.logState('Logs after refresh', capturedLogs)

  const finalScroll = await page.evaluate(() => window.scrollY)
  await logger.logState('Final scroll position after refresh', {
    scrollY: finalScroll,
    scrollReset:
      finalScroll === 0
        ? 'Yes - scroll reset to top'
        : 'No - scroll position maintained',
  })

  // Analyze log patterns
  const logAnalysis = {
    beforeRefresh: {
      total: logsBeforeRefresh.length,
      htmlLogs: logsBeforeRefresh.filter((log) => log.text.includes('[HTML]'))
        .length,
      orchestratorLogs: logsBeforeRefresh.filter((log) =>
        log.text.includes('[ORCHESTRATOR]')
      ).length,
      observerLogs: logsBeforeRefresh.filter((log) =>
        log.text.includes('Observer:')
      ).length,
    },
    afterRefresh: {
      total: capturedLogs.length,
      htmlLogs: capturedLogs.filter((log) => log.text.includes('[HTML]'))
        .length,
      orchestratorLogs: capturedLogs.filter((log) =>
        log.text.includes('[ORCHESTRATOR]')
      ).length,
      observerLogs: capturedLogs.filter((log) => log.text.includes('Observer:'))
        .length,
    },
  }

  await logger.logState('Log pattern analysis', logAnalysis)

  // Check for any error logs
  const errorLogs = [...logsBeforeRefresh, ...capturedLogs].filter(
    (log) => log.type === 'error'
  )
  if (errorLogs.length > 0) {
    await logger.logState('Error logs detected', errorLogs)
  }

  await logger.captureFullState('scroll-debug-logs-complete')

  // This test is for debugging purposes - verify logs were captured
  expect(logsBeforeRefresh.length + capturedLogs.length).toBeGreaterThan(0)
})
