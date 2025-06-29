import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { Observer } from 'gsap/Observer'
import { useGSAP } from '@gsap/react'
import type { StoryScrollerProps } from '../types'
import type { LenisInstance, ObserverInstance } from '../types/internal'
import { useScrollContext, useScrollActions } from '../context/ScrollContext'
import { createBrowserService, type IBrowserService } from '../services/BrowserService'
import { useDebouncing } from '../hooks/useDebouncing'

// Dynamic import for Lenis to prevent SSR issues
const initLenis = async () => {
  const Lenis = (await import('lenis')).default
  return Lenis
}

// Register GSAP plugins once at module level
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Observer)

/**
 * StoryScroller component creates a full-page section-snapping experience.
 * Built with paranoid engineering practices to handle common production issues.
 */
export const StoryScroller: React.FC<StoryScrollerProps> = ({
  sections,
  duration = 1.2,
  easing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  tolerance = 50,
  touchMultiplier = 2,
  preventDefault = true,
  invertDirection = false,
  onSectionChange,
  keyboardNavigation = true,
  containerClassName = '',
  sectionClassName = '',
  className = '',
  style = {},
  // New physics parameters
  magneticThreshold = 0.15,
  magneticVelocityThreshold = 5,
  velocityTrackingRate = 16,
  enableMagneticSnap = true,
}) => {
  const container = useRef<HTMLDivElement>(null)
  const { state, browserService: contextBrowserService } = useScrollContext()
  const actions = useScrollActions()
  
  // Initialize useDebouncing hook for centralized timing control
  const debouncing = useDebouncing({
    navigationCooldown: 200,
    animationDuration: duration * 1000, // Convert to milliseconds
    scrollEndDelay: 150,
    preventOverlap: true,
    trackMomentum: true,
    debug: false, // Reduce console noise
    logPrefix: '🎯 StoryScroller'
  })
  
  // Early return if sections not provided
  if (!sections || sections.length === 0) {
    console.error('StoryScroller: sections prop is required and must not be empty')
    return null
  }
  
  // Use browserService from context if available, otherwise create a stable one
  const browserServiceRef = useRef<IBrowserService>()
  if (!browserServiceRef.current) {
    browserServiceRef.current = contextBrowserService || createBrowserService()
  }
  const browserService = browserServiceRef.current
  
  // Detect client-side mount using browserService
  useEffect(() => {
    if (browserService.isClient()) {
      actions.setClientMounted()
    }
    // Pathname state can be set externally if needed
  }, []) // Remove deps that change on every render
  
  // Update section count when sections change
  useEffect(() => {
    actions.setSectionCount(sections.length)
  }, [sections.length, actions])
  
  // Handle route changes
  useEffect(() => {
    if (!browserService.isClient()) return
    
    const handleRouteChange = () => {
      browserService.scrollTo(0, 0)
      ScrollTrigger.refresh(true)
      actions.resetScrollState()
    }
    
    // Next.js route change detection via pathname
    if (state.pathname !== null) {
      handleRouteChange()
    }
    
    // Fallback to popstate for browser navigation
    browserService.addEventListener('popstate', handleRouteChange)
    return () => {
      browserService.removeEventListener('popstate', handleRouteChange)
    }
  }, [state.pathname, actions, browserService])
  
  // Handle external navigation changes from useStoryScroller hook
  const gotoSectionRef = useRef<((index: number, isExternal?: boolean, externalFromIndex?: number) => void) | null>(null)
  const previousExternalIndex = useRef<number>(state.currentIndex)
  
  useEffect(() => {
    console.log('🎯 StoryScroller: External navigation to section:', state.currentIndex, {
      isAnimating: state.isAnimating,
      sectionCount: sections.length,
      timestamp: Date.now(),
      previousExternalIndex: previousExternalIndex.current
    })
    
    // If we have a gotoSection function and the state changed externally
    if (gotoSectionRef.current && state.currentIndex !== previousExternalIndex.current && !state.isAnimating) {
      console.log('🔄 Triggering internal navigation from external state change')
      gotoSectionRef.current(state.currentIndex, true, previousExternalIndex.current)
    }
    
    previousExternalIndex.current = state.currentIndex
  }, [state.currentIndex, state.isAnimating])

  // PARANOID: Prevent React Strict Mode double initialization 
  const systemInitialized = useRef(false)
  
  // Remove local scroll state - now handled by useDebouncing
  
  // Track current state in refs to avoid closure issues
  const stateRef = useRef(state)
  stateRef.current = state
  
  // Main scroll system setup
  useGSAP(
    () => {
      if (!browserService.isClient() || !container.current) return
      
      // CRITICAL: Prevent double initialization (React Strict Mode)
      if (systemInitialized.current) {
        console.log('🚨 BLOCKED React Strict Mode double initialization - cleanup will handle previous instance')
        return
      }
      console.log('🔧 System initialization starting - setting flag to prevent doubles')
      systemInitialized.current = true
      
      // These need to be in the outer scope for cleanup
      let lenisInstance: LenisInstance | null = null
      let observer: ObserverInstance | null = null
      let tickerCallback: ((time: number) => void) | null = null
      let scrollEndHandler: (() => void) | null = null
      let cleanupKeyboard: (() => void) | undefined
      let wheelDebounceTimeout: NodeJS.Timeout | null = null
      let velocityTrackingInterval: NodeJS.Timeout | null = null
      
      const setupScroll = async () => {
        try {
          console.log('🚀 StoryScroller: Initializing scroll system', {
            clientMounted: browserService.isClient(),
            sectionCount: sections.length,
            containerExists: !!container.current
          })
          
          const Lenis = await initLenis()
          
          // Initialize Lenis with physics-based configuration
          lenisInstance = new Lenis({
            duration: duration * 0.8, // Slightly faster base for responsiveness
            easing: (t) => {
              // Smooth cubic ease-out for natural deceleration
              return 1 - Math.pow(1 - t, 3)
            },
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            touchMultiplier,
            infinite: false,
            autoResize: true,
            // Physics improvements
            lerp: 0.1, // Smoothing factor (0-1, lower = smoother)
            wheelMultiplier: 0.8, // Reduce wheel sensitivity for better control
            normalizeWheel: true, // Normalize across different input devices
          }) as unknown as LenisInstance
          
          // FEEDBACK IMPLEMENTATION: Use GSAP ticker instead of separate RAF
          // This ensures single source of truth for animation loop (feedback recommendation)
          tickerCallback = (time: number) => {
            // GSAP provides time in seconds, Lenis needs milliseconds
            lenisInstance?.raf(time * 1000)
          }
          gsap.ticker.add(tickerCallback)
          
          // CRITICAL: Lenis scroll sync with proper state management
          let lastScrollUpdate = 0
          let lastScrollY = 0
          let lenisEventCount = 0
          let scrollVelocity = 0
          
          lenisInstance.on('scroll', () => {
            const now = Date.now()
            lenisEventCount++
            
            // Throttle to max 60fps to prevent spam
            if (now - lastScrollUpdate < 16) return
            lastScrollUpdate = now
            
            const scrollY = browserService.getScrollY()
            const viewportHeight = browserService.getInnerHeight()
            const calculatedSection = Math.round(scrollY / viewportHeight)
            const clampedSection = Math.max(0, Math.min(sections.length - 1, calculatedSection))
            
            // CRITICAL: Update section state if it changed
            if (clampedSection !== stateRef.current.currentIndex && !stateRef.current.isAnimating) {
              // Throttle this log to prevent spam
              if (lenisEventCount % 20 === 1) {
                console.log('🔄 Auto-updating section based on scroll position:', {
                  scrollY,
                  oldSection: stateRef.current.currentIndex,
                  newSection: clampedSection,
                  calculatedSection
                })
              }
              actions.setCurrentIndex(clampedSection)
            }
            
            // Log significant changes only
            const isSignificantChange = Math.abs(scrollY - lastScrollY) > 20
            if (lenisEventCount <= 3 || isSignificantChange) {
              console.log('📜 Lenis scroll:', {
                scrollY,
                calculatedSection,
                currentIndex: stateRef.current.currentIndex,
                isAnimating: stateRef.current.isAnimating
              })
              lastScrollY = scrollY
            }
            
            if (!stateRef.current.isAnimating) {
              ScrollTrigger.update()
              actions.startScrolling()
            }
          })
          
          // FEEDBACK IMPLEMENTATION: Use ScrollTrigger scrollEnd event + timeout failsafe
          scrollEndHandler = () => {
            console.log('📍 ScrollTrigger scrollEnd - resetting all flags')
            actions.endAnimation()
            actions.endScrolling()
            debouncing.markScrollEnd()
            
            // PARANOID: Double-check section state after scroll ends
            setTimeout(() => {
              const finalScrollY = browserService.getScrollY()
              const finalSection = Math.round(finalScrollY / browserService.getInnerHeight())
              const clampedFinal = Math.max(0, Math.min(sections.length - 1, finalSection))
              
              if (clampedFinal !== stateRef.current.currentIndex) {
                console.log('🚨 Section state was wrong after scroll end - fixing:', {
                  finalScrollY,
                  expectedSection: clampedFinal,
                  actualState: stateRef.current.currentIndex
                })
                actions.setCurrentIndex(clampedFinal)
              }
            }, 100)
          }
          ScrollTrigger.addEventListener('scrollEnd', scrollEndHandler)
          
          // Delay ScrollTrigger config to avoid hydration errors
          if (browserService.isClient()) {
            setTimeout(() => {
              ScrollTrigger.config({
                syncInterval: 40,
                autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
              })
              
              const docBody = browserService.getDocumentBody()
              if (docBody) {
                ScrollTrigger.scrollerProxy(docBody, {
                  scrollTop(value?: number) {
                    if (arguments.length && value !== undefined) {
                      lenisInstance?.scrollTo(value, { immediate: true })
                    }
                    return lenisInstance?.scroll || 0
                  },
                  getBoundingClientRect() {
                    const viewport = browserService.getViewportDimensions()
                    return {
                      top: 0,
                      left: 0,
                      width: viewport.width,
                      height: viewport.height,
                    }
                  },
                })
              }
              ScrollTrigger.refresh(true)
            }, 100)
          }
          
          // Navigation function
          const gotoSection = (index: number, isExternal: boolean = false, externalFromIndex?: number) => {
            console.log('🧭 gotoSection called:', {
              requestedIndex: index,
              currentIndex: stateRef.current.currentIndex,
              canNavigate: debouncing.canNavigate(),
              isAnimating: stateRef.current.isAnimating,
              sectionCount: sections.length,
              isExternal,
              externalFromIndex
            })
            
            if (!debouncing.canNavigate()) {
              console.log('❌ Navigation blocked - cannot navigate:', debouncing.getDebugInfo())
              return
            }
            
            const newIndex = gsap.utils.clamp(0, sections.length - 1, index)
            
            // For external navigation, we don't need to check if already at target
            // because the state has already changed
            if (!isExternal && newIndex === stateRef.current.currentIndex) {
              console.log('❌ Navigation blocked - already at target section:', newIndex)
              return
            }
            
            console.log('✅ Starting navigation:', {
              from: stateRef.current.currentIndex,
              to: newIndex,
              timestamp: Date.now()
            })
            
            // For external navigation, the current state might already be updated
            const fromIndex = isExternal && externalFromIndex !== undefined ? externalFromIndex : stateRef.current.currentIndex
            
            // Only update state if this is internal navigation
            // For external navigation, state is already updated
            if (!isExternal) {
              actions.gotoSection(newIndex, Date.now())
            } else {
              // For external navigation, just mark animation start
              actions.startAnimation()
            }
            
            debouncing.markAnimationStart(`section-${fromIndex}-to-${newIndex}`)
            
            // Calculate target scroll position
            const targetElement = container.current?.querySelector(`[data-section-idx='${newIndex}']`)
            if (!targetElement) {
              console.error(`❌ Section element not found for index ${newIndex}`)
              actions.endAnimation()
              debouncing.markAnimationEnd(`section-${fromIndex}-to-${newIndex}`)
              return
            }
            
            // Calculate scroll position using getBoundingClientRect for transforms
            const currentScrollY = browserService.getScrollY()
            const elementRect = targetElement.getBoundingClientRect()
            const targetY = elementRect.top + currentScrollY
            
            console.log('📐 Scroll calculation:', {
              currentScrollY,
              elementRect: {
                top: elementRect.top,
                height: elementRect.height
              },
              targetY,
              viewportHeight: browserService.getInnerHeight()
            })
            
            // Animate scroll to target position
            const windowTarget = browserService.getWindow()
            if (!windowTarget) {
              console.error('❌ Window target not available')
              return
            }
            
            // Calculate dynamic physics-based animation
            const distance = Math.abs(targetY - currentScrollY)
            const viewportHeight = browserService.getInnerHeight()
            const sectionsToTravel = distance / viewportHeight
            
            // Convert velocity to pixels per frame for easier reasoning
            const velocityPerFrame = scrollVelocity / 60
            const absVelocity = Math.abs(velocityPerFrame)
            
            // Physics-based duration calculation
            // Base time = distance / velocity, with constraints
            let dynamicDuration = duration
            
            if (absVelocity > 1) {
              // If scrolling with momentum, calculate natural deceleration time
              const decelerationRate = 0.95 // Friction coefficient
              const timeToStop = Math.log(1 / absVelocity) / Math.log(decelerationRate)
              dynamicDuration = Math.min(duration * 1.5, Math.max(duration * 0.5, timeToStop / 60))
            } else {
              // Low velocity - use base duration scaled by distance
              dynamicDuration = duration * Math.sqrt(sectionsToTravel)
            }
            
            // Physics-based easing selection
            let dynamicEase = "power2.inOut"
            
            // Check if this is a magnetic snap
            const currentSection = currentScrollY / viewportHeight
            const distanceToTarget = Math.abs(currentSection - newIndex)
            const isMagneticSnap = distanceToTarget < magneticThreshold
            
            if (isMagneticSnap) {
              // Magnetic snap - use custom back easing for subtle overshoot
              dynamicEase = "back.out(1.2)"
              dynamicDuration *= 0.7 // Faster for snappy feel
            } else if (absVelocity > 10) {
              // High velocity - natural deceleration curve
              dynamicEase = "power3.out"
            } else if (absVelocity > 3) {
              // Medium velocity - smooth curve
              dynamicEase = "power2.out"
            } else {
              // Low velocity - symmetric ease
              dynamicEase = "power2.inOut"
            }
            
            // Apply momentum to the ease if scrolling in same direction
            const scrollDirection = targetY > currentScrollY ? 1 : -1
            const velocityDirection = scrollVelocity > 0 ? 1 : -1
            const isWithMomentum = scrollDirection === velocityDirection && absVelocity > 5
            
            if (isWithMomentum) {
              // Scrolling with momentum - use out easing for natural deceleration
              dynamicEase = dynamicEase.replace('.inOut', '.out')
            }
            
            console.log('🎬 Starting GSAP scroll animation:', {
              from: currentScrollY,
              to: targetY,
              duration: dynamicDuration.toFixed(2),
              velocity: velocityPerFrame.toFixed(1),
              ease: dynamicEase,
              isMagneticSnap,
              withMomentum: isWithMomentum
            })
            
            gsap.to(windowTarget, {
              scrollTo: {
                y: targetY,
                autoKill: false,
              },
              duration: dynamicDuration,
              ease: dynamicEase,
              onComplete: () => {
                const finalScrollY = browserService.getScrollY()
                console.log('✅ GSAP scroll animation complete:', {
                  finalScrollY,
                  targetSection: newIndex,
                  stateIndex: stateRef.current.currentIndex
                })
                
                // CRITICAL: Ensure state is synchronized after animation
                if (stateRef.current.currentIndex !== newIndex) {
                  console.log('🔄 Syncing state after GSAP animation complete')
                  actions.setCurrentIndex(newIndex)
                }
                
                actions.endAnimation()
                debouncing.markAnimationEnd(`section-${fromIndex}-to-${newIndex}`)
              },
            })
            
            // Notify parent component
            onSectionChange?.(newIndex)
            console.log('📢 Parent notified of section change:', newIndex)
          }
          
          // Store gotoSection in ref for external access
          gotoSectionRef.current = gotoSection
          
          // Track wheel events for debugging
          let lastWheelTime = 0
          let wheelEventCount = 0
          
          // Start velocity tracking for magnetic effect
          if (enableMagneticSnap) {
            let velocityHistory: number[] = []
            let lastVelocityTime = Date.now()
            
            velocityTrackingInterval = setInterval(() => {
              const currentScrollY = browserService.getScrollY()
              const currentTime = Date.now()
              const timeDelta = (currentTime - lastVelocityTime) / 1000 // Convert to seconds
              
              if (timeDelta > 0) {
                // Calculate velocity in pixels per second
                const instantVelocity = (currentScrollY - lastScrollY) / timeDelta
                velocityHistory.push(instantVelocity)
                
                // Keep only last 5 samples for smoothing
                if (velocityHistory.length > 5) {
                  velocityHistory.shift()
                }
                
                // Calculate average velocity for smoothing
                scrollVelocity = velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length
                
                // Check for magnetic snap if velocity is low
                const absVelocity = Math.abs(scrollVelocity)
                if (absVelocity < magneticVelocityThreshold * 60 && !stateRef.current.isAnimating) { // Convert threshold to px/sec
                  const viewportHeight = browserService.getInnerHeight()
                  const currentSection = currentScrollY / viewportHeight
                  const nearestSection = Math.round(currentSection)
                  const distanceToNearest = Math.abs(currentSection - nearestSection)
                  
                  // Calculate magnetic force based on distance (inverse square law)
                  const magneticForce = distanceToNearest < magneticThreshold 
                    ? Math.pow(1 - (distanceToNearest / magneticThreshold), 2)
                    : 0
                  
                  // Only trigger if magnetic force is strong enough AND it's a different section
                  if (magneticForce > 0.5 && 
                      nearestSection !== stateRef.current.currentIndex &&
                      nearestSection >= 0 && 
                      nearestSection < sections.length) {
                    
                    console.log('🧲 Magnetic snap triggered:', {
                      currentSection: currentSection.toFixed(2),
                      nearestSection,
                      distance: distanceToNearest.toFixed(3),
                      velocity: (absVelocity / 60).toFixed(1), // Show in px/frame for consistency
                      magneticForce: magneticForce.toFixed(2),
                      threshold: magneticThreshold
                    })
                    
                    // Don't immediately snap - let the animation handle it smoothly
                    gotoSection(nearestSection)
                  }
                }
                
                lastScrollY = currentScrollY
                lastVelocityTime = currentTime
              }
            }, velocityTrackingRate)
          }
          
          // GSAP Observer for scroll/touch input
          const windowTarget = browserService.getWindow()
          if (!windowTarget) return
          
          observer = Observer.create({
            target: windowTarget,
            type: 'wheel,touch',
            tolerance: tolerance / 2, // Reduce tolerance to make single scroll more responsive
            preventDefault,
            wheelSpeed: invertDirection ? -1 : 1,
            onDown: () => {
              const now = Date.now()
              wheelEventCount++
              const timeSinceLastWheel = now - lastWheelTime
              lastWheelTime = now
              
              const targetIndex = stateRef.current.currentIndex + 1
              
              // CRITICAL: Check debouncing conditions first
              if (!debouncing.canNavigate()) {
                // Only log occasionally to prevent spam
                if (wheelEventCount % 50 === 0) {
                  console.log('❌ Observer onDown blocked - debounced (logged every 50th)')
                }
                return
              }
              
              console.log('⬇️ Observer onDown triggered:', {
                currentIndex: stateRef.current.currentIndex,
                targetIndex,
                atLastSection: stateRef.current.currentIndex === sections.length - 1,
                wheelEventCount,
                timeSinceLastWheel
              })
              
              if (stateRef.current.currentIndex >= sections.length - 1) {
                console.log('❌ Observer onDown blocked - at last section')
                return
              }
              
              if (!debouncing.canNavigate()) {
                console.log('❌ Observer onDown blocked - navigation disabled')
                return
              }
              
              // Navigate to target
              gotoSection(targetIndex)
            },
            onUp: () => {
              const now = Date.now()
              wheelEventCount++
              const timeSinceLastWheel = now - lastWheelTime
              lastWheelTime = now
              
              const targetIndex = stateRef.current.currentIndex - 1
              
              // CRITICAL: Check debouncing conditions first
              if (!debouncing.canNavigate()) {
                // Only log occasionally to prevent spam
                if (wheelEventCount % 50 === 0) {
                  console.log('❌ Observer onUp blocked - debounced (logged every 50th)')
                }
                return
              }
              
              console.log('⬆️ Observer onUp triggered:', {
                currentIndex: stateRef.current.currentIndex,
                targetIndex,
                atFirstSection: stateRef.current.currentIndex === 0,
                wheelEventCount,
                timeSinceLastWheel
              })
              
              if (stateRef.current.currentIndex <= 0) {
                console.log('❌ Observer onUp blocked - at first section')
                return
              }
              
              if (!debouncing.canNavigate()) {
                console.log('❌ Observer onUp blocked - navigation disabled')
                return
              }
              
              // Navigate to target
              gotoSection(targetIndex)
            },
          })
          
          // Keyboard navigation
          if (keyboardNavigation) {
            const handleKeydown = (e: Event) => {
              const keyEvent = e as KeyboardEvent
              
              console.log('⌨️ Keyboard event:', {
                key: keyEvent.key,
                currentIndex: stateRef.current.currentIndex,
                isAnimating: stateRef.current.isAnimating,
                canNavigate: debouncing.canNavigate()
              })
              
              if (stateRef.current.isAnimating) {
                console.log('❌ Keyboard navigation blocked - animation in progress')
                return
              }
              
              switch (keyEvent.key) {
                case 'ArrowDown':
                case 'PageDown':
                  console.log('⬇️ Keyboard down navigation')
                  keyEvent.preventDefault()
                  gotoSection(stateRef.current.currentIndex + 1)
                  break
                case 'ArrowUp':
                case 'PageUp':
                  console.log('⬆️ Keyboard up navigation')
                  keyEvent.preventDefault()
                  gotoSection(stateRef.current.currentIndex - 1)
                  break
                case 'Home':
                  console.log('🏠 Keyboard home navigation')
                  keyEvent.preventDefault()
                  gotoSection(0)
                  break
                case 'End':
                  console.log('🔚 Keyboard end navigation')
                  keyEvent.preventDefault()
                  gotoSection(sections.length - 1)
                  break
              }
            }
            browserService.addEventListener('keydown', handleKeydown)
            
            // Store cleanup for keyboard
            cleanupKeyboard = () => {
              browserService.removeEventListener('keydown', handleKeydown)
            }
          }
        } catch (error) {
          console.error('StoryScroller initialization failed:', error)
        }
        
        return undefined
      }
      
      setupScroll()
      
      // Cleanup function
      return () => {
        console.log('🧹 StoryScroller cleanup starting - resetting initialization flag')
        systemInitialized.current = false
        gotoSectionRef.current = null
        
        cleanupKeyboard?.()
        
        // Clear wheel debounce timeout
        if (wheelDebounceTimeout) {
          clearTimeout(wheelDebounceTimeout)
        }
        
        // Clear velocity tracking interval
        if (velocityTrackingInterval) {
          clearInterval(velocityTrackingInterval)
        }
        
        // Remove GSAP ticker callback
        if (tickerCallback) {
          gsap.ticker.remove(tickerCallback)
        }
        
        // Remove scrollEnd listener
        if (scrollEndHandler) {
          ScrollTrigger.removeEventListener('scrollEnd', scrollEndHandler)
        }
        
        // Kill Observer
        observer?.kill()
        
        // Destroy Lenis
        lenisInstance?.destroy()
        
        // Nuclear cleanup for route changes
        ScrollTrigger.killAll()
        gsap.killTweensOf('*')
        
        console.log('✅ StoryScroller cleanup complete')
      }
    },
    { scope: container, dependencies: [sections.length] }
  )
  
  // Handle ScrollTrigger style cleanup properly without hydration hacks
  useEffect(() => {
    if (!browserService.isClient()) return
    
    const docBody = browserService.getDocumentBody()
    if (!docBody) return
    
    // Use a more robust approach - let ScrollTrigger manage its own styles
    // and only intervene if there's an actual issue
    const cleanupScrollTriggerStyles = () => {
      // ScrollTrigger will handle its own cleanup
      ScrollTrigger.refresh()
    }
    
    // Run cleanup after a short delay to ensure proper initialization
    const timeoutId = setTimeout(cleanupScrollTriggerStyles, 200)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [browserService])
  
  // Render
  return (
    <div
      ref={container}
      className={`story-scroller-container ${containerClassName} ${className}`.trim()}
      style={{
        width: '100vw',
        overscrollBehavior: 'none',
        ...style,
      }}
    >
      {sections.map((child, i) => (
        <section
          key={i}
          data-section-idx={i}
          tabIndex={0}
          className={`story-scroller-section ${sectionClassName}`.trim()}
          style={{
            height: '100vh',
            width: '100%',
            outline: 'none',
            scrollSnapAlign: 'start',
          }}
        >
          {child}
        </section>
      ))}
    </div>
  )
}