# Test info

- Name: debug observer system
- Location: /home/will/local_dev/portfolio/apps/robin-noguier/e2e/debug-observer.spec.ts:3:1

# Error details

```
Error: locator.evaluate: Error: strict mode violation: locator('#sticky-header-container') resolved to 2 elements:
    1) <div id="sticky-header-container">…</div> aka getByText('ry designs ❤️ IR Student • MSU hello@rysdesigns.com').first()
    2) <div id="sticky-header-container">…</div> aka getByText('ry designs ❤️ IR Student • MSU hello@rysdesigns.com').nth(1)

Call log:
  - waiting for locator('#sticky-header-container')

    at /home/will/local_dev/portfolio/apps/robin-noguier/e2e/debug-observer.spec.ts:52:74
```

# Page snapshot

```yaml
- main:
    - heading "Rylee Brasseur" [level=1]
    - paragraph: International Relations Student
    - paragraph: Michigan State University | James Madison College
    - link "3 3 2 A T - R Y L E E":
        - /url: tel:3322879533
    - text: '|'
    - link "hello@rysdesigns.com":
        - /url: mailto:hello@rysdesigns.com
    - text: Scroll to explore
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test'
   2 |
   3 | test('debug observer system', async ({ page }) => {
   4 |   // Capture console errors
   5 |   page.on('console', msg => {
   6 |     if (msg.type() === 'error') {
   7 |       console.log('CONSOLE ERROR:', msg.text())
   8 |     }
   9 |   })
  10 |
  11 |   // Capture page errors
  12 |   page.on('pageerror', error => {
  13 |     console.log('PAGE ERROR:', error.message)
  14 |   })
  15 |
  16 |   await page.goto('http://localhost:5173')
  17 |   await page.waitForLoadState('networkidle')
  18 |   await page.waitForTimeout(2000)
  19 |
  20 |   // Take screenshot to see current state
  21 |   await page.screenshot({ path: 'apps/robin-noguier/debug-initial-state.png', fullPage: true })
  22 |
  23 |   // Check what elements exist
  24 |   const heroExists = await page.locator('.heroTitle').count()
  25 |   const heroTitleExists = await page.locator('h1').count()
  26 |   const headerExists = await page.locator('#sticky-header-container').count()
  27 |
  28 |   console.log('Hero title (.heroTitle):', heroExists)
  29 |   console.log('H1 elements:', heroTitleExists)
  30 |   console.log('Header container:', headerExists)
  31 |
  32 |   // List all h1 elements and their classes
  33 |   const h1Elements = await page.locator('h1').all()
  34 |   for (let i = 0; i < h1Elements.length; i++) {
  35 |     const text = await h1Elements[i].textContent()
  36 |     const className = await h1Elements[i].getAttribute('class')
  37 |     console.log(`H1 ${i}: "${text}" - class: "${className}"`)
  38 |   }
  39 |
  40 |   // Try scrolling to see what happens
  41 |   console.log('Triggering scroll down...')
  42 |   await page.mouse.wheel(0, 500)
  43 |   await page.waitForTimeout(2000)
  44 |
  45 |   await page.screenshot({ path: 'apps/robin-noguier/debug-after-scroll.png', fullPage: true })
  46 |
  47 |   // Check state after scroll
  48 |   const headerAfterScroll = await page.locator('#sticky-header-container').count()
  49 |   console.log('Header after scroll:', headerAfterScroll)
  50 |
  51 |   if (headerAfterScroll > 0) {
> 52 |     const headerOpacity = await page.locator('#sticky-header-container').evaluate(
     |                                                                          ^ Error: locator.evaluate: Error: strict mode violation: locator('#sticky-header-container') resolved to 2 elements:
  53 |       el => window.getComputedStyle(el).opacity
  54 |     )
  55 |     console.log('Header opacity:', headerOpacity)
  56 |   }
  57 | })
```
