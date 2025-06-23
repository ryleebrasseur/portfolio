import { test } from '@playwright/test'

test('capture initial viewport', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // Wait for animations

  await page.screenshot({
    path: 'viewport-screenshot.png',
    fullPage: false,
  })

  console.log('Screenshot saved to viewport-screenshot.png')
})
