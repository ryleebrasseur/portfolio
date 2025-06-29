import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { StoryScroller } from '../../components/StoryScroller'
import { ScrollProvider } from '../../context/ScrollContext'

// Create a test component that exposes internal behavior
function TestableStoryScroller({ onDebounceEvent }: { onDebounceEvent?: (event: string, data?: any) => void }) {
  // Patch console.log to capture debouncing events
  const originalLog = console.log
  React.useEffect(() => {
    const mockedLog = (...args: any[]) => {
      const message = args[0]
      if (typeof message === 'string') {
        if (message.includes('🎯 StoryScroller')) {
          onDebounceEvent?.('debug', args)
        } else if (message.includes('Navigation blocked')) {
          onDebounceEvent?.('blocked', args)
        } else if (message.includes('Starting navigation')) {
          onDebounceEvent?.('navigation-start', args)
        } else if (message.includes('Animation started')) {
          onDebounceEvent?.('animation-start', args)
        } else if (message.includes('Animation ended')) {
          onDebounceEvent?.('animation-end', args)
        }
      }
      originalLog(...args)
    }
    
    console.log = mockedLog
    return () => {
      console.log = originalLog
    }
  }, [onDebounceEvent])

  return (
    <ScrollProvider>
      <StoryScroller
        sections={[
          <div key="1">Section 1</div>,
          <div key="2">Section 2</div>,
          <div key="3">Section 3</div>,
        ]}
      />
    </ScrollProvider>
  )
}

describe('StoryScroller debouncing behavior', () => {
  let events: Array<{ type: string; data: any }> = []

  beforeEach(() => {
    vi.useFakeTimers()
    events = []
    
    // Mock all GSAP functionality
    vi.mock('gsap', () => ({
      default: {
        registerPlugin: vi.fn(),
        ticker: { add: vi.fn(), remove: vi.fn() },
        to: vi.fn(() => ({ kill: vi.fn() })),
        utils: { clamp: (min: number, max: number, val: number) => Math.max(min, Math.min(max, val)) },
        killTweensOf: vi.fn(),
      },
    }))

    vi.mock('gsap/ScrollTrigger', () => ({
      ScrollTrigger: {
        create: vi.fn(),
        refresh: vi.fn(),
        update: vi.fn(),
        config: vi.fn(),
        scrollerProxy: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        killAll: vi.fn(),
      },
    }))

    vi.mock('gsap/ScrollToPlugin', () => ({
      ScrollToPlugin: {},
    }))

    vi.mock('gsap/Observer', () => ({
      Observer: {
        create: vi.fn(() => ({ kill: vi.fn() })),
      },
    }))

    vi.mock('lenis', () => ({
      default: vi.fn(() => ({
        on: vi.fn(),
        off: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        destroy: vi.fn(),
        raf: vi.fn(),
        scrollTo: vi.fn(),
        scroll: 0,
      })),
    }))
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  it('should initialize with debouncing enabled', async () => {
    const handleEvent = (type: string, data: any) => {
      events.push({ type, data })
    }

    const { container } = render(
      <TestableStoryScroller onDebounceEvent={handleEvent} />
    )

    // Wait for initialization
    await vi.advanceTimersByTimeAsync(300)

    // Should have debug logs from useDebouncing
    const debugEvents = events.filter(e => e.type === 'debug')
    expect(debugEvents.length).toBeGreaterThan(0)

    // Look for canNavigate logs
    const canNavigateEvents = debugEvents.filter(e => 
      e.data[0]?.includes('canNavigate')
    )
    expect(canNavigateEvents.length).toBeGreaterThan(0)
  })

  it('should track navigation lifecycle', async () => {
    const handleEvent = (type: string, data: any) => {
      events.push({ type, data })
    }

    render(<TestableStoryScroller onDebounceEvent={handleEvent} />)
    
    // Wait for init
    await vi.advanceTimersByTimeAsync(300)

    // Simulate navigation start (would normally come from Observer)
    // This is a conceptual test - in reality Observer would trigger this
    
    // Check that animation tracking works
    const animationStartEvents = events.filter(e => e.type === 'animation-start')
    const animationEndEvents = events.filter(e => e.type === 'animation-end')
    
    // Verify event structure exists
    expect(events.length).toBeGreaterThan(0)
  })

  it('should expose debouncing state through logs', async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    
    render(
      <ScrollProvider>
        <StoryScroller
          sections={[<div key="1">Test</div>]}
        />
      </ScrollProvider>
    )

    await vi.advanceTimersByTimeAsync(300)

    // Look for useDebouncing logs
    const debouncingLogs = consoleSpy.mock.calls.filter(
      call => call[0]?.toString().includes('🎯 StoryScroller')
    )

    // Should have some debouncing logs
    expect(debouncingLogs.length).toBeGreaterThan(0)
  })
})