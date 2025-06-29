/**
 * Utilities for forcing scroll synchronization and emergency recovery
 * These are the "nuclear options" for when things go wrong
 */

import type { ScrollState } from '../types/scroll-state'

/**
 * Force all animation systems to sync to the specified state
 * This is the primary recovery mechanism when state drift is detected
 */
export function forceSync(options: {
  targetSection: number
  state: ScrollState
  controllers: {
    lenis?: any
    scrollTween?: any
  }
  viewportHeight?: number
  onComplete?: () => void
}): void {
  const { 
    targetSection, 
    state, 
    controllers, 
    viewportHeight = window.innerHeight,
    onComplete 
  } = options
  
  console.log('🔄 FORCE SYNC INITIATED:', {
    targetSection,
    currentSection: state.currentSection,
    isAnimating: state.isAnimating,
    timestamp: Date.now(),
  })
  
  // Step 1: Kill any active animations
  if (controllers.scrollTween?.isActive?.()) {
    console.log('  → Killing active scroll tween')
    controllers.scrollTween.kill()
  }
  
  // Step 2: Calculate target position
  const targetY = targetSection * viewportHeight
  
  // Step 3: Force immediate scroll position update
  console.log('  → Setting scroll position to:', targetY)
  window.scrollTo(0, targetY)
  
  // Step 4: Update Lenis if it exists
  if (controllers.lenis) {
    console.log('  → Syncing Lenis position')
    controllers.lenis.scrollTo(targetY, { immediate: true })
    
    // Reset Lenis internal state
    if (controllers.lenis.stop) {
      controllers.lenis.stop()
    }
    if (controllers.lenis.reset) {
      controllers.lenis.reset()
    }
  }
  
  // Step 5: Force ScrollTrigger refresh
  if (window.ScrollTrigger) {
    console.log('  → Refreshing ScrollTrigger')
    window.ScrollTrigger.refresh(true)
    window.ScrollTrigger.update()
  }
  
  // Step 6: Verify position after a frame
  requestAnimationFrame(() => {
    const actualY = window.scrollY
    const drift = Math.abs(actualY - targetY)
    
    if (drift > 1) {
      console.warn('  ⚠️ Position drift after sync:', {
        expected: targetY,
        actual: actualY,
        drift,
      })
      
      // Try one more time
      window.scrollTo(0, targetY)
    } else {
      console.log('  ✅ Force sync complete')
    }
    
    onComplete?.()
  })
}

/**
 * Emergency nuclear reset - destroys everything and starts fresh
 * Use this only as a last resort when the system is completely broken
 */
export function emergency(options: {
  onReset?: () => void
  controllers?: {
    lenis?: any
    observer?: any
    scrollTween?: any
    rafId?: number
  }
}): void {
  const { onReset, controllers = {} } = options
  
  console.log('🚨 EMERGENCY RESET TRIGGERED - NUCLEAR OPTION')
  console.trace('Emergency reset stack trace')
  
  try {
    // Step 1: Kill all GSAP animations globally
    if (window.gsap) {
      console.log('  → Killing all GSAP animations')
      window.gsap.killTweensOf('*')
    }
    
    // Step 2: Kill all ScrollTriggers
    if (window.ScrollTrigger) {
      console.log('  → Killing all ScrollTriggers')
      window.ScrollTrigger.killAll()
      window.ScrollTrigger.clearMatchMedia()
      window.ScrollTrigger.clearScrollMemory()
    }
    
    // Step 3: Destroy Observer
    if (controllers.observer) {
      console.log('  → Destroying Observer')
      controllers.observer.kill()
    }
    
    // Step 4: Destroy Lenis
    if (controllers.lenis) {
      console.log('  → Destroying Lenis')
      if (controllers.lenis.destroy) {
        controllers.lenis.destroy()
      }
      if (controllers.lenis.stop) {
        controllers.lenis.stop()
      }
    }
    
    // Step 5: Cancel animation frame
    if (controllers.rafId) {
      console.log('  → Cancelling RAF')
      cancelAnimationFrame(controllers.rafId)
    }
    
    // Step 6: Reset scroll position to top
    console.log('  → Resetting scroll to top')
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    // Step 7: Clear any inline styles that might have been added
    const scrollContainer = document.querySelector('[data-scroll-container]')
    if (scrollContainer instanceof HTMLElement) {
      console.log('  → Clearing container styles')
      scrollContainer.style.transform = ''
      scrollContainer.style.willChange = ''
    }
    
    // Step 8: Remove any GSAP-added attributes
    document.querySelectorAll('[data-gsap-id]').forEach(el => {
      el.removeAttribute('data-gsap-id')
      el.removeAttribute('style')
    })
    
    // Step 9: Notify callback
    console.log('  → Emergency reset complete')
    onReset?.()
    
  } catch (error) {
    console.error('🔥 Emergency reset failed:', error)
    
    // Last resort: reload the page
    if (confirm('Scroll system critically failed. Reload page?')) {
      window.location.reload()
    }
  }
}

/**
 * Verify that the actual scroll position matches the expected state
 */
export function verifyScrollPosition(options: {
  expectedSection: number
  tolerance?: number
  viewportHeight?: number
}): {
  isValid: boolean
  actualSection: number
  drift: number
  recommendation: 'none' | 'sync' | 'emergency'
} {
  const { 
    expectedSection, 
    tolerance = 0.1, 
    viewportHeight = window.innerHeight 
  } = options
  
  const actualScrollY = window.scrollY
  const expectedScrollY = expectedSection * viewportHeight
  const drift = Math.abs(actualScrollY - expectedScrollY)
  const driftPercentage = drift / viewportHeight
  const actualSection = Math.round(actualScrollY / viewportHeight)
  
  let isValid = true
  let recommendation: 'none' | 'sync' | 'emergency' = 'none'
  
  if (driftPercentage > tolerance) {
    isValid = false
    
    if (actualSection !== expectedSection) {
      // Section mismatch - needs sync
      recommendation = 'sync'
    } else if (driftPercentage > 0.5) {
      // Major drift - consider emergency
      recommendation = 'emergency'
    } else {
      // Minor drift - sync should fix it
      recommendation = 'sync'
    }
  }
  
  return {
    isValid,
    actualSection,
    drift,
    recommendation,
  }
}

/**
 * Debounced state verification with automatic recovery
 */
let verificationTimeout: NodeJS.Timeout | null = null

export function scheduleStateVerification(options: {
  delay?: number
  state: ScrollState
  onVerify: (result: ReturnType<typeof verifyScrollPosition>) => void
}): () => void {
  const { delay = 500, state, onVerify } = options
  
  // Clear any existing verification
  if (verificationTimeout) {
    clearTimeout(verificationTimeout)
  }
  
  // Schedule new verification
  verificationTimeout = setTimeout(() => {
    const result = verifyScrollPosition({
      expectedSection: state.currentSection,
    })
    
    console.log('🔍 Scheduled state verification:', {
      ...result,
      state: state.currentSection,
    })
    
    onVerify(result)
  }, delay)
  
  // Return cleanup function
  return () => {
    if (verificationTimeout) {
      clearTimeout(verificationTimeout)
      verificationTimeout = null
    }
  }
}

/**
 * Calculate the required scroll correction
 */
export function calculateScrollCorrection(options: {
  currentScrollY: number
  targetSection: number
  viewportHeight?: number
}): {
  distance: number
  duration: number
  direction: 'up' | 'down' | 'none'
} {
  const { 
    currentScrollY, 
    targetSection, 
    viewportHeight = window.innerHeight 
  } = options
  
  const targetScrollY = targetSection * viewportHeight
  const distance = targetScrollY - currentScrollY
  
  // Calculate duration based on distance
  const baseDistance = viewportHeight
  const baseDuration = 1.2
  const durationScale = Math.min(Math.abs(distance) / baseDistance, 3)
  const duration = baseDuration * Math.sqrt(durationScale) // Sqrt for more natural feel
  
  return {
    distance: Math.abs(distance),
    duration,
    direction: distance > 0 ? 'down' : distance < 0 ? 'up' : 'none',
  }
}