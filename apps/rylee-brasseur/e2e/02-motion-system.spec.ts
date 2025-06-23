import { test, expect } from './support/fixtures'

test.describe('Motion System - Core Functionality', () => {
  test('should execute discrete state transitions perfectly', async ({ motionPage }) => {
    // STEP 1: Verify initial hero state
    await motionPage.captureState('02-motion-1-initial-hero.png')
    await motionPage.expectHeroState()
    
    // Verify header is created but hidden initially
    await expect(motionPage.headerContainer).toBeAttached()
    await expect(motionPage.headerContainer).not.toBeVisible()
    
    // STEP 2: Transition to header state
    await motionPage.triggerHeaderTransition()
    await motionPage.captureState('02-motion-2-header-state.png')
    await motionPage.expectHeaderState()
    
    // Verify header content
    await expect(motionPage.headerName).toHaveText('ry designs ❤️')
    
    // STEP 3: Transition back to hero state - THIS MUST WORK
    await motionPage.triggerHeroTransition()
    await motionPage.captureState('02-motion-3-back-to-hero.png')
    await motionPage.expectHeroState()
    
    // STEP 4: Test multiple transitions work reliably
    await motionPage.triggerHeaderTransition()
    await motionPage.expectHeaderState()
    
    await motionPage.triggerHeroTransition()
    await motionPage.expectHeroState()
    
    console.log('✅ All discrete state transitions working perfectly')
  })
  
  test('should prevent simultaneous animations', async ({ motionPage }) => {
    await motionPage.expectHeroState()
    
    // Rapidly trigger multiple transitions
    await motionPage.page.evaluate(() => {
      ;(window as any).testGotoSection('header')
      ;(window as any).testGotoSection('hero')
      ;(window as any).testGotoSection('header')
    })
    
    await motionPage.page.waitForTimeout(3000)
    
    // Debug: capture what actually happened
    await motionPage.captureState('debug-simultaneous-animations.png')
    
    const heroOpacity = await motionPage.getHeroOpacity()
    const headerOpacity = await motionPage.getHeaderOpacity()
    
    console.log(`DEBUG: Hero opacity: ${heroOpacity}, Header opacity: ${headerOpacity}`)
    
    // One should be visible, the other hidden
    const validState = (heroOpacity > 0.9 && headerOpacity < 0.1) || 
                      (headerOpacity > 0.9 && heroOpacity < 0.1)
    
    if (!validState) {
      console.log(`FAILED: Expected one element visible (>0.9) and other hidden (<0.1)`)
      console.log(`Got: Hero=${heroOpacity}, Header=${headerOpacity}`)
    }
    
    expect(validState).toBe(true)
    
    console.log('✅ Animation blocking working correctly')
  })
  
  test('should maintain state consistency', async ({ motionPage }) => {
    // Transition to header
    await motionPage.triggerHeaderTransition()
    await motionPage.expectHeaderState()
    
    // Reload page
    await motionPage.goto()
    
    // Should reset to hero state
    await motionPage.expectHeroState()
    
    console.log('✅ State consistency maintained across reloads')
  })
})

test.describe('Motion System - Visual Documentation', () => {
  test('should capture complete motion sequence', async ({ motionPage }) => {
    const sequence = [
      { 
        name: 'hero-initial',
        action: async () => await motionPage.expectHeroState(),
        description: 'Initial hero state with full content'
      },
      { 
        name: 'transition-to-header',
        action: async () => await motionPage.triggerHeaderTransition(),
        description: 'Transition to header state'
      },
      { 
        name: 'header-complete', 
        action: async () => await motionPage.expectHeaderState(),
        description: 'Header state with sticky navigation'
      },
      { 
        name: 'transition-to-hero',
        action: async () => await motionPage.triggerHeroTransition(),
        description: 'Transition back to hero state'
      },
      { 
        name: 'hero-restored',
        action: async () => await motionPage.expectHeroState(),
        description: 'Hero state fully restored'
      }
    ]
    
    for (const step of sequence) {
      await step.action()
      await motionPage.captureState(`02-sequence-${step.name}.png`)
      console.log(`📸 Captured: ${step.description}`)
    }
    
    console.log('✅ Complete motion sequence documented')
  })
  
  test('should capture scroll-based motion documentation', async ({ motionPage }) => {
    // Get total scrollable height
    const totalHeight = await motionPage.page.evaluate(() => {
      return document.documentElement.scrollHeight - window.innerHeight
    })
    
    // Document key scroll positions
    const positions = [
      { percent: 0, description: 'Initial hero state' },
      { percent: 25, description: 'Motion begins' },
      { percent: 50, description: 'Mid-transition' },
      { percent: 75, description: 'Approaching header' },
      { percent: 100, description: 'Scroll complete' }
    ]
    
    for (const pos of positions) {
      const scrollY = (totalHeight * pos.percent) / 100
      
      await motionPage.page.evaluate((y) => {
        window.scrollTo({ top: y, behavior: 'instant' })
      }, scrollY)
      
      await motionPage.page.waitForTimeout(500)
      await motionPage.captureState(`02-scroll-${pos.percent}pct.png`, false)
      
      console.log(`📸 Captured ${pos.percent}%: ${pos.description}`)
    }
    
    // Reset to top
    await motionPage.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await motionPage.page.waitForTimeout(500)
    
    console.log('✅ Scroll-based motion documented')
  })
})

test.describe('Motion System - Observer Integration', () => {
  test('should document observer behavior (may not trigger in test env)', async ({ motionPage }) => {
    await motionPage.captureState('02-observer-initial.png', false)
    await motionPage.expectHeroState()
    
    // Try scroll events (may not trigger Observer in test environment)
    await motionPage.scrollDown()
    await motionPage.captureState('02-observer-after-down.png', false)
    
    await motionPage.scrollUp()
    await motionPage.captureState('02-observer-after-up.png', false)
    
    // Document what we expect vs what happens
    const heroOpacity = await motionPage.getHeroOpacity()
    const headerOpacity = await motionPage.getHeaderOpacity()
    
    console.log(`Hero opacity after scroll events: ${heroOpacity}`)
    console.log(`Header opacity after scroll events: ${headerOpacity}`)
    console.log('📝 Observer behavior documented (test env limitations noted)')
  })
})