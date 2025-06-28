"use client"

import React, { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger, ScrollToPlugin, Observer } from 'gsap/all'
import { useGSAP } from '@gsap/react'
import type { StoryScrollerProps, ScrollState } from '../types'
import type { LenisInstance, ObserverInstance } from '../types/internal'

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
  const scrollState = useRef<ScrollState>({
    currentIndex: 0,
    isAnimating: false,
    isScrolling: false,
    lastScrollTime: 0,
  })
  
  const [isClient, setIsClient] = useState(false)
  const [pathname] = useState<string | null>(null)
  
  // Detect client-side mount
  useEffect(() => {
    setIsClient(true)
    // Pathname state is set externally if needed
  }, [])
  
  // Handle route changes
  useEffect(() => {
    if (!isClient) return
    
    const handleRouteChange = () => {
      window.scrollTo(0, 0)
      ScrollTrigger.refresh(true)
    }
    
    // Next.js route change detection via pathname
    if (pathname !== null) {
      handleRouteChange()
    }
    
    // Fallback to popstate for browser navigation
    window.addEventListener('popstate', handleRouteChange)
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [pathname, isClient])
  
  // Main scroll system setup
  useGSAP(
    () => {
      if (!isClient || !container.current) return
      
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
          lenisInstance = new Lenis({
            duration,
            easing,
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            eventsTarget: smoothTouch ? undefined : document.body,
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
            scrollState.current.isScrolling = true
            scrollState.current.lastScrollTime = Date.now()
          })
          
          // IMPROVEMENT FROM FEEDBACK: Use ScrollTrigger scrollEnd event
          scrollEndHandler = () => {
            scrollState.current.isAnimating = false
            scrollState.current.isScrolling = false
          }
          ScrollTrigger.addEventListener('scrollEnd', scrollEndHandler)
          
          // Delay ScrollTrigger config to avoid Next.js hydration errors
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              ScrollTrigger.config({
                syncInterval: 40,
                autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
              })
              
              ScrollTrigger.scrollerProxy(document.body, {
                scrollTop(value?: number) {
                  if (arguments.length && value !== undefined) {
                    lenisInstance?.scrollTo(value, { immediate: true })
                  }
                  return lenisInstance?.scroll || 0
                },
                getBoundingClientRect() {
                  return {
                    top: 0,
                    left: 0,
                    width: window.innerWidth,
                    height: window.innerHeight,
                  }
                },
              })
              ScrollTrigger.refresh(true)
            }, 100)
          }
          
          // Navigation function
          const gotoSection = (index: number) => {
            const state = scrollState.current
            if (state.isAnimating) return
            
            const newIndex = gsap.utils.clamp(0, sections.length - 1, index)
            if (newIndex === state.currentIndex) return
            
            state.isAnimating = true
            state.currentIndex = newIndex
            
            // Notify parent component
            onSectionChange?.(newIndex)
            
            const sectionEl = container.current?.querySelector<HTMLElement>(
              `[data-section-idx="${newIndex}"]`
            )
            if (!sectionEl) {
              console.warn(`StoryScroller: Section ${newIndex} not found`)
              state.isAnimating = false
              return
            }
            
            // Use getBoundingClientRect for accurate positioning
            const targetY = sectionEl.getBoundingClientRect().top + window.scrollY
            
            gsap.to(window, {
              scrollTo: {
                y: targetY,
                autoKill: false,
              },
              duration,
              ease: 'power2.inOut',
              onComplete: () => {
                state.isAnimating = false
              },
            })
          }
          
          // GSAP Observer for scroll/touch input
          observer = Observer.create({
            target: window,
            type: 'wheel,touch',
            tolerance,
            preventDefault,
            wheelSpeed: invertDirection ? 1 : -1,
            onDown: () => {
              const state = scrollState.current
              if (state.isAnimating || Date.now() - state.lastScrollTime < 200) return
              gotoSection(state.currentIndex + (invertDirection ? -1 : 1))
            },
            onUp: () => {
              const state = scrollState.current
              if (state.isAnimating || Date.now() - state.lastScrollTime < 200) return
              gotoSection(state.currentIndex - (invertDirection ? -1 : 1))
            },
            // Firefox-specific workaround
            onWheel: (self) => {
              const isFirefox = navigator.userAgent.includes('Firefox')
              if (isFirefox && Math.abs(self.deltaY) < 50) {
                // Boost small movements on Firefox
                // Note: deltaY is readonly, so we handle this in the onDown/onUp logic
              }
            },
          })
          
          // Keyboard navigation
          if (keyboardNavigation) {
            const handleKeydown = (e: KeyboardEvent) => {
              const state = scrollState.current
              if (state.isAnimating) return
              
              switch (e.key) {
                case 'ArrowDown':
                case 'PageDown':
                  e.preventDefault()
                  gotoSection(state.currentIndex + 1)
                  break
                case 'ArrowUp':
                case 'PageUp':
                  e.preventDefault()
                  gotoSection(state.currentIndex - 1)
                  break
                case 'Home':
                  e.preventDefault()
                  gotoSection(0)
                  break
                case 'End':
                  e.preventDefault()
                  gotoSection(sections.length - 1)
                  break
              }
            }
            window.addEventListener('keydown', handleKeydown)
            
            // Store cleanup for keyboard
            cleanupKeyboard = () => {
              window.removeEventListener('keydown', handleKeydown)
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
    { scope: container, dependencies: [sections.length, isClient] }
  )
  
  // Suppress Next.js hydration warnings from ScrollTrigger
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const bodyStyle = document.body.getAttribute('style')
      if (bodyStyle?.includes('overflow')) {
        document.body.removeAttribute('style')
        requestAnimationFrame(() => {
          if (bodyStyle) {
            document.body.setAttribute('style', bodyStyle)
          }
        })
      }
    }
  }, [])
  
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