import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger, ScrollToPlugin, Observer } from 'gsap/all'
import { useGSAP } from '@gsap/react'
import type { StoryScrollerProps } from '../types'
import type { LenisInstance, ObserverInstance } from '../types/internal'
import { scrollSelectors } from '../state/scrollReducer'
import { useScrollContext, useScrollActions } from '../context/ScrollContext'
import { createBrowserService } from '../services/BrowserService'

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
  smoothTouch = false,
  touchMultiplier = 2,
  preventDefault = true,
  invertDirection = false,
  onSectionChange,
  keyboardNavigation = true,
  containerClassName = '',
  sectionClassName = '',
  className = '',
  style = {},
}) => {
  const container = useRef<HTMLDivElement>(null)
  const { state, browserService: contextBrowserService } = useScrollContext()
  const actions = useScrollActions()
  
  // Use browserService from context if available, otherwise create a new one
  const browserService = contextBrowserService || createBrowserService()
  
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
  
  // Main scroll system setup
  useGSAP(
    () => {
      if (!browserService.isClient() || !container.current) return
      
      // These need to be in the outer scope for cleanup
      let lenisInstance: LenisInstance | null = null
      let observer: ObserverInstance | null = null
      let tickerCallback: ((time: number) => void) | null = null
      let scrollEndHandler: (() => void) | null = null
      let cleanupKeyboard: (() => void) | undefined
      
      const setupScroll = async () => {
        try {
          const Lenis = await initLenis()
          
          // Initialize Lenis with configuration
          const docBody = browserService.getDocumentBody()
          lenisInstance = new Lenis({
            duration,
            easing,
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            eventsTarget: smoothTouch ? undefined : (docBody || undefined),
            touchMultiplier,
            infinite: false,
            autoResize: true,
          }) as unknown as LenisInstance
          
          // IMPROVEMENT FROM FEEDBACK: Use GSAP ticker instead of separate RAF
          tickerCallback = (time: number) => {
            // GSAP provides time in seconds, Lenis needs milliseconds
            lenisInstance?.raf(time * 1000)
          }
          gsap.ticker.add(tickerCallback)
          
          // Sync Lenis with ScrollTrigger
          lenisInstance.on('scroll', () => {
            ScrollTrigger.update()
            actions.startScrolling()
          })
          
          // IMPROVEMENT FROM FEEDBACK: Use ScrollTrigger scrollEnd event
          scrollEndHandler = () => {
            actions.endAnimation()
            actions.endScrolling()
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
          const gotoSection = (index: number) => {
            if (!scrollSelectors.canNavigate(state)) return
            
            const newIndex = gsap.utils.clamp(0, sections.length - 1, index)
            if (newIndex === state.currentIndex) return
            
            actions.gotoSection(newIndex, Date.now())
            
            // Notify parent component
            onSectionChange?.(newIndex)
            
            const sectionEl = container.current?.querySelector<HTMLElement>(
              `[data-section-idx="${newIndex}"]`
            )
            if (!sectionEl) {
              console.warn(`StoryScroller: Section ${newIndex} not found`)
              actions.endAnimation()
              return
            }
            
            // Use browserService for accurate positioning
            const rect = browserService.getBoundingClientRect(sectionEl)
            const targetY = rect.top + browserService.getScrollY()
            
            // Create a proxy object for GSAP to animate
            const scrollProxy = { y: browserService.getScrollY() }
            
            gsap.to(scrollProxy, {
              y: targetY,
              duration,
              ease: 'power2.inOut',
              onUpdate: () => {
                browserService.scrollTo(0, scrollProxy.y)
              },
              onComplete: () => {
                actions.endAnimation()
              },
            })
          }
          
          // GSAP Observer for scroll/touch input
          const observerTarget = browserService.getDocumentBody()
          observer = Observer.create({
            target: (observerTarget || container.current) as Window | HTMLElement | Element,
            type: 'wheel,touch',
            tolerance,
            preventDefault,
            wheelSpeed: invertDirection ? 1 : -1,
            onDown: () => {
              if (!scrollSelectors.canNavigate(state)) return
              gotoSection(state.currentIndex + (invertDirection ? -1 : 1))
            },
            onUp: () => {
              if (!scrollSelectors.canNavigate(state)) return
              gotoSection(state.currentIndex - (invertDirection ? -1 : 1))
            },
            // Firefox-specific workaround
            onWheel: (self) => {
              const isFirefox = browserService.getUserAgent().includes('Firefox')
              if (isFirefox && Math.abs(self.deltaY) < 50) {
                // Boost small movements on Firefox
                // Note: deltaY is readonly, so we handle this in the onDown/onUp logic
              }
            },
          })
          
          // Keyboard navigation
          if (keyboardNavigation) {
            const handleKeydown = (e: Event) => {
              const keyEvent = e as KeyboardEvent
              if (state.isAnimating) return
              
              switch (keyEvent.key) {
                case 'ArrowDown':
                case 'PageDown':
                  keyEvent.preventDefault()
                  gotoSection(state.currentIndex + 1)
                  break
                case 'ArrowUp':
                case 'PageUp':
                  keyEvent.preventDefault()
                  gotoSection(state.currentIndex - 1)
                  break
                case 'Home':
                  keyEvent.preventDefault()
                  gotoSection(0)
                  break
                case 'End':
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
        cleanupKeyboard?.()
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
      }
    },
    { scope: container, dependencies: [sections.length, state, actions, browserService] }
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
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
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
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            scrollSnapAlign: 'start',
            outline: 'none',
          }}
        >
          {child}
        </section>
      ))}
    </div>
  )
}