import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { StoryScroller } from '../../components/StoryScroller'
import { ScrollProvider } from '../../context/ScrollContext'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'

// Store references to callbacks for testing
let observerConfig: any = null
let scrollToCallback: ((args: any) => void) | null = null
let lenisScrollHandler: ((args: any) => void) | null = null

// Mock GSAP modules
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    to: vi.fn((target, config) => {
      // Capture the scrollTo callback so we can control animation timing
      if (config.scrollTo) {
        scrollToCallback = config.onComplete
      }
      return { kill: vi.fn() }
    }),
    utils: {
      clamp: (min: number, max: number, value: number) => 
        Math.max(min, Math.min(max, value)),
    },
    killTweensOf: vi.fn(),
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn(() => ({ kill: vi.fn() })),
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
    create: vi.fn((config) => {
      observerConfig = config
      return { kill: vi.fn() }
    }),
  },
}))

// Mock Lenis
const mockLenisInstance = {
  on: vi.fn((event: string, handler: (args: any) => void) => {
    if (event === 'scroll') {
      lenisScrollHandler = handler
    }
  }),
  off: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  destroy: vi.fn(),
  raf: vi.fn(),
  scrollTo: vi.fn(),
  scroll: 0,
}

vi.mock('lenis', () => ({
  default: vi.fn().mockImplementation(() => mockLenisInstance),
}))

describe('useDebouncing integration with StoryScroller', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    observerConfig = null
    scrollToCallback = null
    lenisScrollHandler = null
    
    // Mock console to capture logs but allow some to pass through for debugging
    const originalLog = console.log
    vi.spyOn(console, 'log').mockImplementation((...args) => {
      // Store the call for testing but also log for debugging
      originalLog(...args)
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock window and document for BrowserService
    Object.defineProperty(window, 'scrollTo', {
      value: vi.fn(),
      writable: true
    })
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true
    })
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  it('should prevent navigation when animation is in progress', async () => {
    const onSectionChange = vi.fn()
    
    render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="1">Section 1</div>,
            <div key="2">Section 2</div>,
            <div key="3">Section 3</div>,
          ]}
          onSectionChange={onSectionChange}
        />
      </ScrollProvider>
    )

    // Wait for initialization
    await vi.advanceTimersByTimeAsync(200)

    // Verify Observer was created
    expect(observerConfig).toBeTruthy()
    expect(observerConfig.onDown).toBeDefined()

    // First scroll should work
    observerConfig.onDown()
    
    // Check that animation started (look for specific log)
    const animationStartLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('Animation started:')
    )
    expect(animationStartLogs.length).toBeGreaterThan(0)

    // Try to scroll again immediately - should be blocked
    const logCountBefore = vi.mocked(console.log).mock.calls.length
    observerConfig.onDown()
    
    // Should see a "blocked" message
    const blockedLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('Navigation blocked')
    )
    expect(blockedLogs.length).toBeGreaterThan(0)

    // Complete the animation
    if (scrollToCallback) {
      scrollToCallback({})
    }

    // Wait for debouncing cooldown
    await vi.advanceTimersByTimeAsync(250)

    // Now navigation should work again
    vi.mocked(console.log).mockClear()
    observerConfig.onDown()
    
    const navigationLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('Starting navigation:')
    )
    expect(navigationLogs.length).toBeGreaterThan(0)
  })

  it('should track scroll state separately from animation state', async () => {
    render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="1">Section 1</div>,
            <div key="2">Section 2</div>,
          ]}
        />
      </ScrollProvider>
    )

    await vi.advanceTimersByTimeAsync(200)

    // Trigger a scroll event through Lenis
    expect(lenisScrollHandler).toBeDefined()
    
    // Simulate scrolling
    lenisScrollHandler!({ 
      scroll: 100, 
      limit: 2000, 
      progress: 0.05 
    })

    // Check that scroll was tracked
    const scrollStartLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('markScrollStart')
    )
    
    // Should have marked scroll start
    expect(scrollStartLogs.length).toBeGreaterThan(0)
  })

  it('should respect navigation cooldown after animation', async () => {
    render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="1">Section 1</div>,
            <div key="2">Section 2</div>,
          ]}
        />
      </ScrollProvider>
    )

    await vi.advanceTimersByTimeAsync(200)

    // Navigate once
    observerConfig.onDown()
    
    // Complete animation immediately
    if (scrollToCallback) {
      scrollToCallback({})
    }

    // Try to navigate again immediately - should be blocked by cooldown
    vi.mocked(console.log).mockClear()
    observerConfig.onDown()
    
    const canNavigateLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('canNavigate:') && call[1]?.cooldownMet === false
    )
    
    // Should show cooldown not met
    expect(canNavigateLogs.length).toBeGreaterThan(0)

    // Wait for cooldown
    await vi.advanceTimersByTimeAsync(250)

    // Now should be able to navigate
    vi.mocked(console.log).mockClear()
    observerConfig.onDown()
    
    const navigationAllowed = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('Starting navigation:')
    )
    expect(navigationAllowed.length).toBeGreaterThan(0)
  })

  it('should handle rapid scroll events correctly', async () => {
    render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="1">Section 1</div>,
            <div key="2">Section 2</div>,
            <div key="3">Section 3</div>,
            <div key="4">Section 4</div>,
          ]}
        />
      </ScrollProvider>
    )

    await vi.advanceTimersByTimeAsync(200)

    // Simulate rapid mouse wheel events
    for (let i = 0; i < 10; i++) {
      observerConfig.onDown()
      await vi.advanceTimersByTimeAsync(50) // Small delay between events
    }

    // Should only navigate once because of debouncing
    const navigationStartLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('Starting navigation:')
    )
    
    // Should have started only one navigation
    expect(navigationStartLogs.length).toBe(1)
  })

  it('should fix state closure bug - old callbacks see current state', async () => {
    render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="1">Section 1</div>,
            <div key="2">Section 2</div>,
          ]}
        />
      </ScrollProvider>
    )

    await vi.advanceTimersByTimeAsync(200)

    // Capture the initial onDown callback
    const originalOnDown = observerConfig.onDown

    // Start an animation
    originalOnDown()

    // The old callback should still see that animation is in progress
    vi.mocked(console.log).mockClear()
    originalOnDown() // Using old reference

    // Should be blocked because useDebouncing uses refs
    const blockedLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('Navigation blocked')
    )
    expect(blockedLogs.length).toBeGreaterThan(0)

    // Complete animation
    if (scrollToCallback) {
      scrollToCallback({})
    }
    await vi.advanceTimersByTimeAsync(250)

    // Old callback should now see that navigation is allowed
    vi.mocked(console.log).mockClear()
    originalOnDown()

    const allowedLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('Starting navigation:')
    )
    expect(allowedLogs.length).toBeGreaterThan(0)
  })

  it('should clean up timeouts on unmount', async () => {
    const { unmount } = render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="1">Section 1</div>,
          ]}
        />
      </ScrollProvider>
    )

    await vi.advanceTimersByTimeAsync(200)

    // Start scrolling to create a timeout
    lenisScrollHandler!({ scroll: 100, limit: 1000, progress: 0.1 })

    // Unmount while scroll timeout is pending
    unmount()

    // Advance time - should not throw
    expect(() => vi.advanceTimersByTimeAsync(1000)).not.toThrow()
  })

  it('should track multiple named animations correctly', async () => {
    render(
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

    await vi.advanceTimersByTimeAsync(200)

    // Start navigation which should create a named animation
    observerConfig.onDown()

    // Look for animation with specific naming pattern
    const animationLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('Animation started:') && 
             call[1]?.includes('section-0-to-1')
    )
    
    expect(animationLogs.length).toBeGreaterThan(0)

    // Complete the animation
    if (scrollToCallback) {
      scrollToCallback({})
    }

    // Check animation end was tracked with same ID
    const animationEndLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('Animation ended:') && 
             call[1]?.includes('section-0-to-1')
    )
    
    expect(animationEndLogs.length).toBeGreaterThan(0)
  })

  it('should provide accurate debug information', async () => {
    render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="1">Section 1</div>,
            <div key="2">Section 2</div>,
          ]}
        />
      </ScrollProvider>
    )

    await vi.advanceTimersByTimeAsync(200)

    // Clear logs and trigger navigation
    vi.mocked(console.log).mockClear()
    observerConfig.onDown()

    // Find canNavigate debug logs
    const debugLogs = vi.mocked(console.log).mock.calls.filter(
      call => call[0]?.includes('canNavigate:') && call[1]?.result !== undefined
    )

    expect(debugLogs.length).toBeGreaterThan(0)
    
    // Verify debug info structure
    const debugInfo = debugLogs[0][1]
    expect(debugInfo).toHaveProperty('cooldownMet')
    expect(debugInfo).toHaveProperty('notAnimating')
    expect(debugInfo).toHaveProperty('notScrolling')
    expect(debugInfo).toHaveProperty('timeSinceLastNav')
    expect(debugInfo).toHaveProperty('result')
  })
})