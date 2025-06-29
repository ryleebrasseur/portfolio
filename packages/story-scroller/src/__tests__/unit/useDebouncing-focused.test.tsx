import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import { useDebouncing } from '../../hooks/useDebouncing'

describe('useDebouncing focused tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  it('should prevent navigation during animation', () => {
    const { result } = renderHook(() => useDebouncing({
      navigationCooldown: 200,
      debug: false
    }))

    // Initially can navigate
    expect(result.current.canNavigate()).toBe(true)

    // Start animation
    act(() => {
      result.current.markAnimationStart('test-animation')
    })

    // Cannot navigate during animation
    expect(result.current.canNavigate()).toBe(false)
    expect(result.current.isAnimating()).toBe(true)

    // End animation
    act(() => {
      result.current.markAnimationEnd('test-animation')
    })

    // Still cannot navigate due to cooldown
    expect(result.current.canNavigate()).toBe(false)
    expect(result.current.isAnimating()).toBe(false)

    // Wait for cooldown
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Now can navigate
    expect(result.current.canNavigate()).toBe(true)
  })

  it('should handle rapid navigation attempts', () => {
    const { result } = renderHook(() => useDebouncing({
      navigationCooldown: 200,
      debug: false
    }))

    const attempts: boolean[] = []

    // Simulate rapid navigation attempts
    for (let i = 0; i < 5; i++) {
      if (result.current.canNavigate()) {
        attempts.push(true)
        act(() => {
          result.current.markAnimationStart()
        })
      } else {
        attempts.push(false)
      }
      
      act(() => {
        vi.advanceTimersByTime(50) // 50ms between attempts
      })
    }

    // Only first attempt should succeed
    expect(attempts).toEqual([true, false, false, false, false])
  })

  it('should fix state closure bug in real component', () => {
    let capturedCanNavigate: (() => boolean) | null = null
    let triggerNavigation: (() => void) | null = null

    function TestComponent() {
      const debouncing = useDebouncing({ 
        navigationCooldown: 200,
        debug: false 
      })
      const [mounted, setMounted] = useState(false)

      useEffect(() => {
        // Capture the function reference on mount
        capturedCanNavigate = debouncing.canNavigate
        setMounted(true)
      }, []) // Empty deps - this is the closure bug scenario

      triggerNavigation = () => {
        if (debouncing.canNavigate()) {
          debouncing.markAnimationStart()
        }
      }

      return (
        <div data-testid="test">
          {mounted ? 'Mounted' : 'Not Mounted'}
        </div>
      )
    }

    const { getByTestId } = render(<TestComponent />)
    expect(getByTestId('test')).toBeTruthy()

    // Verify we captured the function
    expect(capturedCanNavigate).toBeTruthy()
    expect(triggerNavigation).toBeTruthy()

    // Initial state - can navigate
    expect(capturedCanNavigate!()).toBe(true)

    // Start animation
    act(() => {
      triggerNavigation!()
    })

    // OLD function reference should see current state (no closure bug)
    expect(capturedCanNavigate!()).toBe(false)
  })

  it('should track multiple concurrent animations', () => {
    const { result } = renderHook(() => useDebouncing({
      debug: false
    }))

    // Start multiple animations
    act(() => {
      result.current.markAnimationStart('hero-exit')
      result.current.markAnimationStart('content-enter')
      result.current.markAnimationStart('nav-transition')
    })

    expect(result.current.isAnimating()).toBe(true)
    expect(result.current.getDebugInfo().activeAnimations).toHaveLength(3)

    // End one animation
    act(() => {
      result.current.markAnimationEnd('hero-exit')
    })

    // Still animating
    expect(result.current.isAnimating()).toBe(true)
    expect(result.current.getDebugInfo().activeAnimations).toHaveLength(2)

    // End remaining animations
    act(() => {
      result.current.markAnimationEnd('content-enter')
      result.current.markAnimationEnd('nav-transition')
    })

    expect(result.current.isAnimating()).toBe(false)
    expect(result.current.getDebugInfo().activeAnimations).toHaveLength(0)
  })

  it('should handle scroll state independently from animation', () => {
    const { result } = renderHook(() => useDebouncing({
      scrollEndDelay: 150,
      debug: false
    }))

    // Start scrolling
    act(() => {
      result.current.markScrollStart()
    })

    expect(result.current.isScrolling()).toBe(true)
    expect(result.current.canNavigate()).toBe(false)

    // Start animation while scrolling
    act(() => {
      result.current.markAnimationStart()
    })

    expect(result.current.isScrolling()).toBe(true)
    expect(result.current.isAnimating()).toBe(true)
    expect(result.current.isDebouncing()).toBe(true)

    // End scroll
    act(() => {
      result.current.markScrollEnd()
    })

    // Still scrolling until delay passes
    expect(result.current.isScrolling()).toBe(true)

    // Wait for scroll end delay
    act(() => {
      vi.advanceTimersByTime(150)
    })

    // Scroll ended but still animating
    expect(result.current.isScrolling()).toBe(false)
    expect(result.current.isAnimating()).toBe(true)
    expect(result.current.canNavigate()).toBe(false)
  })

  it('should provide accurate timing information', () => {
    const { result } = renderHook(() => useDebouncing({
      navigationCooldown: 300,
      debug: false
    }))

    // Navigate once
    act(() => {
      result.current.markAnimationStart()
      result.current.markAnimationEnd()
    })

    // Check timing info immediately
    let debugInfo = result.current.getDebugInfo()
    expect(debugInfo.timeSinceLastNavigation).toBeLessThan(10)

    // Wait 100ms
    act(() => {
      vi.advanceTimersByTime(100)
    })

    debugInfo = result.current.getDebugInfo()
    expect(debugInfo.timeSinceLastNavigation).toBeGreaterThanOrEqual(100)
    expect(debugInfo.timeSinceLastNavigation).toBeLessThan(110)

    // Still can't navigate (cooldown is 300ms)
    expect(result.current.canNavigate()).toBe(false)

    // Wait until cooldown passes
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.canNavigate()).toBe(true)
  })

  it('should reset all state with forceReset', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation()
    const { result } = renderHook(() => useDebouncing({
      debug: false
    }))

    // Set up complex state
    act(() => {
      result.current.markAnimationStart('anim1')
      result.current.markAnimationStart('anim2')
      result.current.markScrollStart()
    })

    expect(result.current.isAnimating()).toBe(true)
    expect(result.current.isScrolling()).toBe(true)
    expect(result.current.getDebugInfo().activeAnimations).toHaveLength(2)

    // Force reset
    act(() => {
      result.current.forceReset()
    })

    expect(result.current.isAnimating()).toBe(false)
    expect(result.current.isScrolling()).toBe(false)
    expect(result.current.getDebugInfo().activeAnimations).toHaveLength(0)
    expect(result.current.canNavigate()).toBe(true)
    expect(consoleSpy).toHaveBeenCalledWith('🎯 Force reset executed')
  })
})