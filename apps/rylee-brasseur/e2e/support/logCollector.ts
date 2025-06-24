import { Page } from '@playwright/test'

export interface LogEntry {
  type: string
  text: string
  timestamp: Date
  args?: any[]
}

export class LogCollector {
  private logs: LogEntry[] = []
  private page: Page
  
  constructor(page: Page) {
    this.page = page
    this.attachListeners()
  }
  
  private attachListeners() {
    // Capture all console messages
    this.page.on('console', msg => {
      const entry: LogEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date(),
        args: msg.args()
      }
      
      this.logs.push(entry)
      
      // Also log to test runner console for real-time visibility
      if (entry.text.includes('[') && entry.text.includes(']')) {
        console.log(`[${entry.type.toUpperCase()}] ${entry.text}`)
      }
    })
    
    // Capture page errors
    this.page.on('pageerror', error => {
      this.logs.push({
        type: 'error',
        text: error.message,
        timestamp: new Date()
      })
      console.error('[PAGE ERROR]', error.message)
    })
  }
  
  // Get all logs
  getAllLogs(): LogEntry[] {
    return [...this.logs]
  }
  
  // Get logs by filter without clearing
  getFilteredLogs(filter: string | RegExp): LogEntry[] {
    if (typeof filter === 'string') {
      return this.logs.filter(log => log.text.includes(filter))
    }
    return this.logs.filter(log => filter.test(log.text))
  }
  
  // Get logs after a specific timestamp
  getLogsSince(timestamp: Date): LogEntry[] {
    return this.logs.filter(log => log.timestamp > timestamp)
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
    console.group(title || '[LogCollector] All logs:')
    this.logs.forEach((log, index) => {
      console.log(`${index}: [${log.type}] ${log.timestamp.toISOString()} - ${log.text}`)
    })
    console.groupEnd()
  }
  
  // Save logs to file for post-mortem analysis
  async saveLogs(filepath: string) {
    // In Playwright tests, use the built-in fs from @playwright/test
    const { writeFile } = await import('fs/promises')
    const logData = {
      capturedAt: new Date().toISOString(),
      url: this.page.url(),
      logs: this.logs
    }
    await writeFile(filepath, JSON.stringify(logData, null, 2))
    console.log(`[LogCollector] Saved ${this.logs.length} logs to ${filepath}`)
  }
  
  // Clear logs (use with caution)
  clear() {
    const count = this.logs.length
    this.logs = []
    console.log(`[LogCollector] Cleared ${count} logs`)
  }
  
  // Get log statistics
  getStats() {
    const stats = {
      total: this.logs.length,
      byType: {} as Record<string, number>,
      byPrefix: {} as Record<string, number>
    }
    
    this.logs.forEach(log => {
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
}