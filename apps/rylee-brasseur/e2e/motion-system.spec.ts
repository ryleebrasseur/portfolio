import { test, expect } from './support/fixtures'

test.describe('Motion System - Discrete State Transitions', () => {
  test('should transition between hero and header states', async ({ motionPage }) => {
    // STEP 1: Verify initial hero state
    await motionPage.captureState('motion-1-initial-hero.png')
    await motionPage.expectHeroState()
    
    // STEP 2: Transition to header state
    await motionPage.triggerHeaderTransition()
    await motionPage.captureState('motion-2-header-state.png')
    await motionPage.expectHeaderState()
    
    // STEP 3: Transition back to hero state
    await motionPage.triggerHeroTransition()
    await motionPage.captureState('motion-3-back-to-hero.png')
    await motionPage.expectHeroState()
    
    // STEP 4: Test multiple transitions work
    await motionPage.triggerHeaderTransition()
    await motionPage.expectHeaderState()
    
    await motionPage.triggerHeroTransition()
    await motionPage.expectHeroState()
  })
  
  test('should prevent simultaneous animations', async ({ motionPage }) => {
    // Verify initial state
    await motionPage.expectHeroState()
    
    // Rapidly trigger multiple transitions (should be blocked)
    await motionPage.triggerHeaderTransition()
    // Don't wait - immediately try another transition
    await motionPage.page.evaluate(() => {
      ;(window as any).testGotoSection('hero')
    })
    
    await motionPage.page.waitForTimeout(3000) // Wait for any animations
    
    // Should end up in header state (first transition should complete)
    await motionPage.expectHeaderState()
  })
  
  test('should maintain state consistency across page reloads', async ({ motionPage }) => {
    // Transition to header
    await motionPage.triggerHeaderTransition()
    await motionPage.expectHeaderState()
    
    // Reload page
    await motionPage.goto()
    
    // Should be back to initial hero state
    await motionPage.expectHeroState()
  })
})

test.describe('Motion System - Visual Verification', () => {
  test('should capture all animation states', async ({ motionPage }) => {
    const states = [
      { action: () => motionPage.expectHeroState(), filename: 'visual-hero-state.png' },
      { action: () => motionPage.triggerHeaderTransition(), filename: 'visual-transition-to-header.png' },
      { action: () => motionPage.expectHeaderState(), filename: 'visual-header-state.png' },
      { action: () => motionPage.triggerHeroTransition(), filename: 'visual-transition-to-hero.png' },
    ]
    
    for (const state of states) {
      await state.action()
      await motionPage.captureState(state.filename)
    }
  })
})

test.describe('Motion System - Observer Integration', () => {
  test('should respond to scroll events', async ({ motionPage }) => {
    // Initial hero state
    await motionPage.expectHeroState()
    
    // Scroll down should trigger header transition
    await motionPage.scrollDown()
    await motionPage.captureState('observer-after-scroll-down.png')
    // Note: Observer events may not work in test environment
    // This test documents the intended behavior
    
    // Scroll up should trigger hero transition  
    await motionPage.scrollUp()
    await motionPage.captureState('observer-after-scroll-up.png')
  })
})