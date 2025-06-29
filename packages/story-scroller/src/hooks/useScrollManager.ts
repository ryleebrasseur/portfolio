import { useRef, useCallback, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Observer } from 'gsap/Observer'
import { useGSAP } from '@gsap/react'
import type { LenisInstance, ObserverInstance } from '../types/internal'
import { useDebouncing } from './useDebouncing'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer)

// Dynamic import for Lenis
const initLenis = async () => {
  const Lenis = (await import('lenis')).default
  return Lenis
}

export interface ScrollManagerConfig {
  sections: number
  duration?: number
  tolerance?: number
  touchMultiplier?: number
  preventDefault?: boolean
  magneticThreshold?: number
  magneticVelocityThreshold?: number
  onSectionChange?: (index: number) => void
}

export interface ScrollManagerState {
  currentSection: number
  targetSection: number | null
  isAnimating: boolean
  isScrolling: boolean
  canNavigate: boolean
  scrollPosition: number
  velocity: number
}

export interface ScrollManagerAPI {
  gotoSection: (index: number) => void
  nextSection: () => void
  prevSection: () => void
  forceSync: () => void
  emergency: () => void
  getState: () => ScrollManagerState
}

/**
 * Centralized scroll manager - single source of truth for all scroll state
 * 
 * TODO: IMPLEMENTATION PLAN
 * 1. Replace stateRef with useScrollState hook
 * 2. Integrate animation queue from utils/animation-queue.ts
 * 3. Use constants from constants/scroll-physics.ts
 * 4. Implement proper error recovery with try/catch blocks
 * 5. Add narrative mode support (currently stubbed)
 * 6. Improve logging with debug levels
 * 7. Add performance monitoring
 * 
 * EXTRACTION TARGETS:
 * - Lines 171-286 of StoryScroller.tsx (Lenis setup)
 * - Lines 307-478 of StoryScroller.tsx (gotoSection logic)
 * - Lines 484-555 of StoryScroller.tsx (velocity tracking)
 * - Lines 557-643 of StoryScroller.tsx (Observer setup)
 * - Lines 645-693 of StoryScroller.tsx (keyboard navigation)
 */
export function useScrollManager(config: ScrollManagerConfig): ScrollManagerAPI {
  const {
    sections,
    duration = 1.2,
    tolerance = 50,
    touchMultiplier = 2,
    preventDefault = true,
    magneticThreshold = 0.15,
    magneticVelocityThreshold = 5,
    onSectionChange,
  } = config

  // TODO: Replace with useScrollState hook
  // const scrollState = useScrollState(config)
  // For now, keep existing implementation
  const stateRef = useRef<ScrollManagerState>({
    currentSection: 0,
    targetSection: null,
    isAnimating: false,
    isScrolling: false,
    canNavigate: true,
    scrollPosition: 0,
    velocity: 0,
  })

  // Animation controllers
  const controllersRef = useRef<{
    lenis: LenisInstance | null
    observer: ObserverInstance | null
    scrollTween: gsap.core.Tween | null
    rafId: number | null
    cleanupFns: (() => void)[]
  }>({
    lenis: null,
    observer: null,
    scrollTween: null,
    rafId: null,
    cleanupFns: [],
  })

  // TODO: Replace with proper navigation queue from utils/animation-queue.ts
  // const navigationQueue = useRef(createNavigationQueue())
  // Navigation request deduplication
  const navigationQueueRef = useRef<{
    targetSection: number | null
    timestamp: number
  }>({
    targetSection: null,
    timestamp: 0,
  })

  /**
   * Force all animation systems to sync to current state
   */
  const forceSync = useCallback(() => {
    const state = stateRef.current
    const viewportHeight = window.innerHeight
    const targetY = state.currentSection * viewportHeight

    console.log('🔄 FORCE SYNC:', {
      currentSection: state.currentSection,
      targetY,
      scrollY: window.scrollY,
    })

    // Kill any active animations
    if (controllersRef.current.scrollTween) {
      controllersRef.current.scrollTween.kill()
      controllersRef.current.scrollTween = null
    }

    // Force scroll position
    window.scrollTo(0, targetY)
    
    // Reset Lenis position if exists
    if (controllersRef.current.lenis) {
      controllersRef.current.lenis.scrollTo(targetY, { immediate: true })
    }

    // Update ScrollTrigger
    ScrollTrigger.refresh(true)

    // Reset state flags
    stateRef.current = {
      ...state,
      targetSection: null,
      isAnimating: false,
      isScrolling: false,
      canNavigate: true,
      scrollPosition: targetY,
      velocity: 0,
    }
  }, [])

  /**
   * Emergency reset - nuclear option
   */
  const emergency = useCallback(() => {
    console.log('🚨 EMERGENCY RESET TRIGGERED')

    // Kill everything
    gsap.killTweensOf('*')
    ScrollTrigger.killAll()
    
    if (controllersRef.current.observer) {
      controllersRef.current.observer.kill()
      controllersRef.current.observer = null
    }

    if (controllersRef.current.lenis) {
      controllersRef.current.lenis.destroy()
      controllersRef.current.lenis = null
    }

    // Reset to section 0
    window.scrollTo(0, 0)
    
    stateRef.current = {
      currentSection: 0,
      targetSection: null,
      isAnimating: false,
      isScrolling: false,
      canNavigate: true,
      scrollPosition: 0,
      velocity: 0,
    }

    // Notify parent
    onSectionChange?.(0)
  }, [onSectionChange])

  /**
   * Navigate to section with deduplication
   */
  const gotoSection = useCallback((index: number) => {
    const state = stateRef.current
    const now = Date.now()
    const clampedIndex = Math.max(0, Math.min(sections - 1, index))

    // TODO: Use proper deduplication from animation-queue.ts
    // const request = enqueueNavigation(navigationQueue.current, {
    //   targetSection: clampedIndex,
    //   source: 'user',
    //   priority: 'normal',
    // })
    // Deduplication checks
    if (state.targetSection === clampedIndex && 
        now - navigationQueueRef.current.timestamp < 100) {
      console.log('❌ Navigation deduplicated:', clampedIndex)
      return
    }

    if (!state.canNavigate || state.isAnimating) {
      console.log('❌ Navigation blocked:', { canNavigate: state.canNavigate, isAnimating: state.isAnimating })
      return
    }

    if (clampedIndex === state.currentSection) {
      console.log('❌ Already at section:', clampedIndex)
      return
    }

    // Update navigation queue
    navigationQueueRef.current = {
      targetSection: clampedIndex,
      timestamp: now,
    }

    // Lock navigation
    stateRef.current = {
      ...state,
      targetSection: clampedIndex,
      isAnimating: true,
      canNavigate: false,
    }

    const viewportHeight = window.innerHeight
    const currentY = window.scrollY
    const targetY = clampedIndex * viewportHeight

    console.log('🎯 Navigation start:', {
      from: state.currentSection,
      to: clampedIndex,
      currentY,
      targetY,
    })

    // Kill any existing animation
    if (controllersRef.current.scrollTween) {
      controllersRef.current.scrollTween.kill()
    }

    // TODO: Extract physics calculations from StoryScroller.tsx lines 383-447
    // const { duration: dynamicDuration, easing } = calculateAnimationPhysics({
    //   currentY,
    //   targetY,
    //   velocity: state.velocity,
    //   magneticActive: state.magneticActive,
    // })
    
    // Animate with GSAP
    controllersRef.current.scrollTween = gsap.to(window, {
      scrollTo: {
        y: targetY,
        autoKill: false,
      },
      duration, // TODO: Use dynamicDuration
      ease: "power2.inOut", // TODO: Use dynamic easing
      onUpdate: () => {
        const progress = controllersRef.current.scrollTween?.progress() || 0
        console.log('📊 Animation progress:', progress.toFixed(2))
      },
      onComplete: () => {
        console.log('✅ Animation complete')
        
        // Verify final position
        const finalY = window.scrollY
        const finalSection = Math.round(finalY / viewportHeight)
        
        if (finalSection !== clampedIndex) {
          console.warn('⚠️ Position drift detected:', {
            expected: clampedIndex,
            actual: finalSection,
          })
          // Force correction
          window.scrollTo(0, targetY)
        }

        // Update state
        stateRef.current = {
          currentSection: clampedIndex,
          targetSection: null,
          isAnimating: false,
          isScrolling: false,
          canNavigate: true,
          scrollPosition: targetY,
          velocity: 0,
        }

        // Clear navigation queue
        navigationQueueRef.current.targetSection = null

        // Notify parent
        onSectionChange?.(clampedIndex)

        // Force ScrollTrigger update
        ScrollTrigger.refresh()
      },
      onInterrupt: () => {
        console.log('⚠️ Animation interrupted')
        forceSync()
      },
    })
  }, [sections, duration, onSectionChange, forceSync])

  const nextSection = useCallback(() => {
    gotoSection(stateRef.current.currentSection + 1)
  }, [gotoSection])

  const prevSection = useCallback(() => {
    gotoSection(stateRef.current.currentSection - 1)
  }, [gotoSection])

  const getState = useCallback(() => {
    return { ...stateRef.current }
  }, [])

  // Initialize on mount
  useEffect(() => {
    console.log('🚀 ScrollManager initializing')

    // Setup Observer for input
    const observer = Observer.create({
      target: window,
      type: 'wheel,touch',
      tolerance,
      preventDefault,
      onDown: () => {
        if (stateRef.current.canNavigate) {
          nextSection()
        }
      },
      onUp: () => {
        if (stateRef.current.canNavigate) {
          prevSection()
        }
      },
    })

    controllersRef.current.observer = observer

    // Periodic state verification
    const verifyInterval = setInterval(() => {
      const state = stateRef.current
      if (state.isAnimating && !controllersRef.current.scrollTween?.isActive()) {
        console.warn('⚠️ Stuck animation detected')
        forceSync()
      }
    }, 500)

    // Cleanup
    return () => {
      console.log('🧹 ScrollManager cleanup')
      clearInterval(verifyInterval)
      observer.kill()
      if (controllersRef.current.scrollTween) {
        controllersRef.current.scrollTween.kill()
      }
      gsap.killTweensOf(window)
    }
  }, [tolerance, preventDefault, nextSection, prevSection, forceSync])

  return {
    gotoSection,
    nextSection,
    prevSection,
    forceSync,
    emergency,
    getState,
  }
}