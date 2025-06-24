import { test, expect } from '@playwright/test'

test('capture scroll debug logs', async ({ page }) => {
  // Capture console logs
  const logs: string[] = []
  page.on('console', msg => {
    if (msg.text().includes('[HTML]') || msg.text().includes('[ORCHESTRATOR]') || msg.text().includes('Observer:')) {
      logs.push(msg.text())
    }
  })
  
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  
  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(100)
  
  console.log('=== BEFORE REFRESH ===')
  logs.forEach(log => console.log(log))
  logs.length = 0 // Clear logs
  
  // REFRESH
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // Give time for all logs
  
  console.log('\n=== AFTER REFRESH ===')
  logs.forEach(log => console.log(log))
  
  const finalScroll = await page.evaluate(() => window.scrollY)
  console.log('\nFinal scroll position:', finalScroll)
  
  // This test is just for debugging, always pass
  expect(true).toBe(true)
})