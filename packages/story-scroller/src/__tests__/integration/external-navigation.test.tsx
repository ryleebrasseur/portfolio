import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import React from 'react'
import { StoryScroller } from '../../components/StoryScroller'
import { ScrollProvider } from '../../context/ScrollContext'
import { useStoryScroller } from '../../hooks/useStoryScroller'

// Mock useDebouncing hook to track animation IDs
vi.mock('../../hooks/useDebouncing', () => ({
  useDebouncing: () => ({
    canNavigate: () => true,
    markAnimationStart: (id: string) => console.log('Animation started:', id),
    markAnimationEnd: (id: string) => console.log('Animation ended:', id),
    markScrollStart: () => {},
    markScrollEnd: () => {},
    getDebugInfo: () => ({}),
  })
}))

// Mock GSAP modules
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    to: vi.fn((target, config) => {
      // Simulate animation completion
      if (config.onComplete) {
        setTimeout(() => config.onComplete(), 100)
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

// Test component that uses external navigation
function TestNavigation({ onStateChange, totalSections = 3 }: { onStateChange?: (index: number) => void, totalSections?: number }) {
  const { currentSection, gotoSection } = useStoryScroller(totalSections)
  
  React.useEffect(() => {
    onStateChange?.(currentSection)
  }, [currentSection, onStateChange])
  
  return (
    <div>
      <div data-testid="current-index">{currentSection}</div>
      <button data-testid="goto-0" onClick={() => gotoSection(0)}>Section 0</button>
      <button data-testid="goto-1" onClick={() => gotoSection(1)}>Section 1</button>
      <button data-testid="goto-2" onClick={() => gotoSection(2)}>Section 2</button>
      <button data-testid="goto-3" onClick={() => gotoSection(3)}>Section 3</button>
    </div>
  )
}

describe('StoryScroller External Navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    
    // Mock console to check for specific logs
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  it('should update currentIndex when using external navigation', async () => {
    const stateChanges: number[] = []
    
    const { getByTestId } = render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="0">Section 0</div>,
            <div key="1">Section 1</div>,
            <div key="2">Section 2</div>,
          ]}
        />
        <TestNavigation onStateChange={(index) => stateChanges.push(index)} />
      </ScrollProvider>
    )
    
    // Wait for initialization
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    
    // Initial state should be 0
    expect(getByTestId('current-index').textContent).toBe('0')
    
    // Click to navigate to section 2
    const gotoButton = getByTestId('goto-2')
    act(() => {
      gotoButton.click()
    })
    
    // Wait for state update
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50)
    })
    
    // Current index should update immediately
    expect(getByTestId('current-index').textContent).toBe('2')
    
    // Check console logs for proper navigation
    const logs = vi.mocked(console.log).mock.calls
    
    // Should see external navigation detection
    const externalNavLogs = logs.filter(call => 
      call[0]?.includes('External navigation to section:')
    )
    expect(externalNavLogs.length).toBeGreaterThan(0)
    expect(externalNavLogs[externalNavLogs.length - 1][1]).toBe(2)
    
    // Should trigger internal navigation
    const internalNavLogs = logs.filter(call =>
      call[0]?.includes('Triggering internal navigation from external state change')
    )
    expect(internalNavLogs.length).toBeGreaterThan(0)
    
    // Should have correct animation IDs
    const gotoSectionLogs = logs.filter(call =>
      call[0]?.includes('gotoSection called:')
    )
    const lastGotoLog = gotoSectionLogs[gotoSectionLogs.length - 1]
    expect(lastGotoLog[1].isExternal).toBe(true)
    expect(lastGotoLog[1].requestedIndex).toBe(2)
  })

  it('should prevent stuck at index 0 bug', async () => {
    const { getByTestId, queryByTestId } = render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="0">Section 0</div>,
            <div key="1">Section 1</div>,
            <div key="2">Section 2</div>,
            <div key="3">Section 3</div>,
          ]}
        />
        <TestNavigation totalSections={4} />
      </ScrollProvider>
    )
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    
    // Navigate through multiple sections
    const navigations = [
      { button: 'goto-1', expected: '1' },
      { button: 'goto-3', expected: '3' },
      { button: 'goto-2', expected: '2' },
      { button: 'goto-0', expected: '0' },
    ]
    
    for (const { button, expected } of navigations) {
      // Skip if button doesn't exist (e.g. goto-3 when we only have 4 sections)
      const buttonElement = queryByTestId(button)
      if (!buttonElement) continue
      
      act(() => {
        buttonElement.click()
      })
      
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })
      
      // Index should update correctly each time
      expect(getByTestId('current-index').textContent).toBe(expected)
    }
    
    // Should NOT see the "stuck at 0" symptom logs
    const autoUpdateLogs = vi.mocked(console.log).mock.calls.filter(call =>
      call[0]?.includes('Auto-updating section based on scroll position')
    )
    
    // If working correctly, should have minimal auto-update logs
    // The bug would cause hundreds of these
    expect(autoUpdateLogs.length).toBeLessThan(10)
  })

  it('should generate correct animation IDs for each navigation', async () => {
    const { getByTestId } = render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="0">Section 0</div>,
            <div key="1">Section 1</div>,
            <div key="2">Section 2</div>,
          ]}
        />
        <TestNavigation />
      </ScrollProvider>
    )
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    
    // Clear previous logs
    vi.mocked(console.log).mockClear()
    
    // Navigate from 0 to 2
    act(() => {
      getByTestId('goto-2').click()
    })
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300) // Wait longer for animation to start
    })
    
    // Navigate from 2 to 1
    act(() => {
      getByTestId('goto-1').click()
    })
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300) // Wait longer for animation to start
    })
    
    // Check animation IDs in logs
    const logs = vi.mocked(console.log).mock.calls
    const animationLogs = logs.filter(call => 
      call[0]?.includes('Animation started:') || 
      call[0]?.includes('Animation ended:')
    )
    
    // Should see correct from-to IDs
    const animationIds = animationLogs
      .filter(log => log[1] && typeof log[1] === 'string' && log[1].includes('section-'))
      .map(log => log[1])
    
    expect(animationIds).toContain('section-0-to-2')
    expect(animationIds).toContain('section-2-to-1')
    
    // Should NOT see stuck "section-0-to-X" for all animations
    const uniqueFromIndices = new Set(
      animationIds
        .filter(id => id?.includes('section-'))
        .map(id => parseInt(id.split('-')[1]))
    )
    expect(uniqueFromIndices.size).toBeGreaterThan(1)
  })

  it('should not create infinite update loops', async () => {
    let renderCount = 0
    
    function CountingComponent() {
      renderCount++
      const { currentSection } = useStoryScroller(2)
      return <div data-testid="render-count">{renderCount}</div>
    }
    
    const { getByTestId } = render(
      <ScrollProvider>
        <StoryScroller
          sections={[
            <div key="0">Section 0</div>,
            <div key="1">Section 1</div>,
          ]}
        />
        <CountingComponent />
        <TestNavigation totalSections={2} />
      </ScrollProvider>
    )
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    
    const initialRenders = renderCount
    
    // Navigate to section 1
    act(() => {
      getByTestId('goto-1').click()
    })
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })
    
    const rendersAfterNav = renderCount - initialRenders
    
    // Should have a reasonable number of renders, not infinite
    // The bug would cause continuous re-renders
    expect(rendersAfterNav).toBeLessThan(10)
  })
})