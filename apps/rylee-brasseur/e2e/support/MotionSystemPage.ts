import { Page, Locator, expect } from '@playwright/test'
import siteConfig from '../../src/config/site-config'

export class MotionSystemPage {
  readonly page: Page

  // Locators
  readonly heroTitle: Locator
  readonly heroSubtitle: Locator
  readonly heroInstitution: Locator
  readonly heroEmail: Locator
  readonly heroContact: Locator
  readonly headerContainer: Locator
  readonly headerName: Locator
  readonly headerEmail: Locator
  readonly scrollIndicator: Locator

  constructor(page: Page) {
    this.page = page

    // Hero elements
    this.heroTitle = page.locator('.heroTitle')
    this.heroSubtitle = page.getByText(siteConfig.hero.title)
    this.heroInstitution = page.getByText(siteConfig.hero.institution)
    this.heroEmail = page.locator(
      `.heroContact a[href="mailto:${siteConfig.hero.email}"]`
    )
    this.heroContact = page.locator('.heroContact')

    // Header elements
    this.headerContainer = page.locator('#sticky-header-container')
    this.headerName = page.locator('#header-name')
    this.headerEmail = page.locator('#header-email')

    // UI elements
    this.scrollIndicator = page.getByText('Scroll to explore')
  }

  // Navigation & Setup
  async goto() {
    await this.page.goto('http://localhost:5173')
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(2000) // Wait for motion system initialization
  }

  // Motion System Actions
  async triggerHeaderTransition() {
    await this.page.evaluate(() => {
      ;(window as any).testGotoSection('header')
    })
    await this.page.waitForTimeout(2000) // Wait for animation
  }

  async triggerHeroTransition() {
    await this.page.evaluate(() => {
      ;(window as any).testGotoSection('hero')
    })
    await this.page.waitForTimeout(2000) // Wait for animation
  }

  async scrollDown(amount = 500) {
    await this.page.mouse.wheel(0, amount)
    await this.page.waitForTimeout(1500)
  }

  async scrollUp(amount = 500) {
    await this.page.mouse.wheel(0, -amount)
    await this.page.waitForTimeout(1500)
  }

  // State Verification
  async getHeroOpacity(): Promise<number> {
    return await this.heroTitle.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
  }

  async getHeaderOpacity(): Promise<number> {
    const exists = (await this.headerContainer.count()) > 0
    if (!exists) return 0

    return await this.headerContainer.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).opacity)
    )
  }

  // Custom Assertions
  async expectHeroState() {
    await expect(this.heroTitle).toBeVisible()
    await expect(this.heroTitle).toHaveText(siteConfig.hero.name)
    await expect(this.heroSubtitle).toBeVisible()
    await expect(this.heroInstitution).toBeVisible()
    await expect(this.heroEmail).toBeVisible()

    const heroOpacity = await this.getHeroOpacity()
    expect(heroOpacity).toBeGreaterThan(0.9)

    // Header should be hidden or not visible
    if ((await this.headerContainer.count()) > 0) {
      await expect(this.headerContainer).not.toBeVisible()
    }
  }

  async expectHeaderState() {
    await expect(this.headerContainer).toBeVisible()
    await expect(this.headerName).toBeVisible()
    await expect(this.headerName).toHaveText(siteConfig.header.brandName)
    await expect(this.headerEmail).toBeVisible()

    const headerOpacity = await this.getHeaderOpacity()
    expect(headerOpacity).toBeGreaterThan(0.9)

    // Hero should be faded out
    const heroOpacity = await this.getHeroOpacity()
    expect(heroOpacity).toBeLessThan(0.1)
  }

  async expectDiscreteTransition(
    fromState: 'hero' | 'header',
    toState: 'hero' | 'header'
  ) {
    if (toState === 'header') {
      await this.expectHeaderState()
    } else {
      await this.expectHeroState()
    }
  }

  // Screenshot utilities
  async captureState(filename: string, fullPage = true) {
    await this.page.screenshot({
      path: `./test-results/screenshots/${filename}`,
      fullPage,
    })
  }
}
