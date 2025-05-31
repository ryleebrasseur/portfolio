import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Rylee Brasseur/)
})

test('main app component loads', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('#root')).toBeVisible()
})
