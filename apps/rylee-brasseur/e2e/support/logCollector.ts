import { Page } from '@playwright/test'

export interface LogEntry {
  type: string
  text: string
  timestamp: Date
  // args removed to prevent memory leaks from object references
}

export class LogCollector {
  private logs: LogEntry[] = []
  private page: Page
  private readonly MAX_LOGS = 1000

  // Batching mechanism
  private buffer: LogEntry[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 100
  private readonly FLUSH_INTERVAL = 500 // milliseconds

  constructor(page: Page) {
    this.page = page
    this.attachListeners()
  }

  // Add log to buffer instead of immediate storage
  private addLog(entry: LogEntry) {
    this.buffer.push(entry)

    // Flush if buffer reaches BATCH_SIZE
    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flushBuffer()
    } else {
      // Schedule a flush if not already scheduled
      this.scheduleFlush()
    }
  }

  // Schedule a flush after FLUSH_INTERVAL
  private scheduleFlush() {
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushBuffer()
      }, this.FLUSH_INTERVAL)
    }
  }

  // Flush buffer to logs array
  private flushBuffer() {
    if (this.buffer.length === 0) return

    // Clear timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    // Process buffer
    for (const entry of this.buffer) {
      // Implement circular buffer - remove oldest entry if we exceed MAX_LOGS
      if (this.logs.length >= this.MAX_LOGS) {
        this.logs.shift() // Remove oldest entry
      }
      this.logs.push(entry)
    }

    // Clear buffer
    this.buffer = []
  }

  private attachListeners() {
    // Capture all console messages
    this.page.on('console', (msg) => {
      const entry: LogEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date(),
        // Don't store args to avoid memory leaks from object references
      }

      // Add to buffer instead of direct storage
      this.addLog(entry)

      // Also log to test runner console for real-time visibility
      if (entry.text.includes('[') && entry.text.includes(']')) {
        console.log(`[${entry.type.toUpperCase()}] ${entry.text}`)
      }
    })

    // Capture page errors
    this.page.on('pageerror', (error) => {
      const entry: LogEntry = {
        type: 'error',
        text: error.message,
        timestamp: new Date(),
      }

      // Add to buffer
      this.addLog(entry)

      console.error('[PAGE ERROR]', error.message)
    })
  }

  // Get all logs
  getAllLogs(): LogEntry[] {
    // Flush buffer before returning logs
    this.flushBuffer()
    return [...this.logs]
  }

  // Get logs by filter without clearing
  getFilteredLogs(filter: string | RegExp): LogEntry[] {
    // Flush buffer before filtering
    this.flushBuffer()
    if (typeof filter === 'string') {
      return this.logs.filter((log) => log.text.includes(filter))
    }
    return this.logs.filter((log) => filter.test(log.text))
  }

  // Get logs after a specific timestamp
  getLogsSince(timestamp: Date): LogEntry[] {
    // Flush buffer before filtering
    this.flushBuffer()
    return this.logs.filter((log) => log.timestamp > timestamp)
  }

  // Mark a point in time for later reference
  mark(): Date {
    const now = new Date()
    console.log(`[LogCollector] Marked at ${now.toISOString()}`)
    return now
  }

  // Get logs since a marked point
  getLogsSinceMark(mark: Date): LogEntry[] {
    return this.getLogsSince(mark)
  }

  // Dump all logs to console for debugging
  dumpLogs(title?: string) {
    // Flush buffer before dumping
    this.flushBuffer()
    console.group(title || '[LogCollector] All logs:')
    this.logs.forEach((log, index) => {
      console.log(
        `${index}: [${log.type}] ${log.timestamp.toISOString()} - ${log.text}`
      )
    })
    console.groupEnd()
  }

  // Save logs to file for post-mortem analysis
  async saveLogs(filepath: string) {
    // Flush buffer before saving
    this.flushBuffer()

    // In Playwright tests, use the built-in fs from @playwright/test
    const { writeFile } = await import('fs/promises')
    const logData = {
      capturedAt: new Date().toISOString(),
      url: this.page.url(),
      logs: this.logs,
    }
    await writeFile(filepath, JSON.stringify(logData, null, 2))
    console.log(`[LogCollector] Saved ${this.logs.length} logs to ${filepath}`)
  }

  // Clear logs (use with caution)
  clear() {
    // Flush buffer first
    this.flushBuffer()
    const count = this.logs.length
    this.logs = []
    console.log(`[LogCollector] Cleared ${count} logs`)
  }

  // Get log statistics
  getStats() {
    // Flush buffer before calculating stats
    this.flushBuffer()

    const stats = {
      total: this.logs.length,
      maxLogs: this.MAX_LOGS,
      byType: {} as Record<string, number>,
      byPrefix: {} as Record<string, number>,
    }

    this.logs.forEach((log) => {
      // Count by type
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1

      // Count by prefix (e.g., [Observer], [HeroToContactHeader])
      const prefixMatch = log.text.match(/^\[([^\]]+)\]/)
      if (prefixMatch) {
        const prefix = prefixMatch[1]
        stats.byPrefix[prefix] = (stats.byPrefix[prefix] || 0) + 1
      }
    })

    return stats
  }

  // Cleanup method to clear timer and flush remaining logs
  cleanup() {
    // Clear any pending timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    // Flush any remaining logs in buffer
    this.flushBuffer()

    console.log(
      `[LogCollector] Cleaned up - flushed ${this.logs.length} total logs`
    )
  }
}
