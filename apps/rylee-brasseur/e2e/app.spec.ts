import { test, expect } from '@playwright/test'

test('has title', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Robin Noguier/)
})

test('main app component loads', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('#root')).toBeVisible()
})