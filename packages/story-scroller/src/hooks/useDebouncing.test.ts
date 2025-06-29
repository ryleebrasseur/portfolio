import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebouncing } from './useDebouncing'

describe('useDebouncing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  describe('canNavigate', () => {
    it('should allow navigation initially', () => {
      const { result } = renderHook(() => useDebouncing())
      expect(result.current.canNavigate()).toBe(true)
    })

    it('should prevent navigation during animation', () => {
      const { result } = renderHook(() => useDebouncing())
      
      act(() => {
        result.current.markAnimationStart()
      })
      
      expect(result.current.canNavigate()).toBe(false)
    })

    it('should prevent navigation during scrolling', () => {
      const { result } = renderHook(() => useDebouncing())
      
      act(() => {
        result.current.markScrollStart()
      })
      
      expect(result.current.canNavigate()).toBe(false)
    })

    it('should respect navigation cooldown', () => {
      const { result } = renderHook(() => useDebouncing({ 
        navigationCooldown: 500 
      }))
      
      act(() => {
        result.current.markAnimationStart()
        result.current.markAnimationEnd()
      })
      
      // Immediately after animation ends, cooldown not met
      expect(result.current.canNavigate()).toBe(false)
      
      // After cooldown period
      act(() => {
        vi.advanceTimersByTime(500)
      })
      
      expect(result.current.canNavigate()).toBe(true)
    })

    it('should allow navigation when preventOverlap is false', () => {
      const { result } = renderHook(() => useDebouncing({ 
        preventOverlap: false,
        navigationCooldown: 0
      }))
      
      act(() => {
        result.current.markAnimationStart()
      })
      
      expect(result.current.canNavigate()).toBe(true)
    })
  })

  describe('animation tracking', () => {
    it('should track single animation', () => {
      const { result } = renderHook(() => useDebouncing())
      
      expect(result.current.isAnimating()).toBe(false)
      
      act(() => {
        result.current.markAnimationStart()
      })
      
      expect(result.current.isAnimating()).toBe(true)
      
      act(() => {
        result.current.markAnimationEnd()
      })
      
      expect(result.current.isAnimating()).toBe(false)
    })

    it('should track multiple named animations', () => {
      const { result } = renderHook(() => useDebouncing())
      
      act(() => {
        result.current.markAnimationStart('fade-out')
        result.current.markAnimationStart('slide-in')
      })
      
      expect(result.current.isAnimating()).toBe(true)
      expect(result.current.getDebugInfo().activeAnimations).toEqual(['fade-out', 'slide-in'])
      
      act(() => {
        result.current.markAnimationEnd('fade-out')
      })
      
      // Still animating because slide-in is active
      expect(result.current.isAnimating()).toBe(true)
      
      act(() => {
        result.current.markAnimationEnd('slide-in')
      })
      
      expect(result.current.isAnimating()).toBe(false)
    })

    it('should handle duplicate animation names', () => {
      const { result } = renderHook(() => useDebouncing())
      
      act(() => {
        result.current.markAnimationStart('test')
        result.current.markAnimationStart('test') // Duplicate
      })
      
      expect(result.current.getDebugInfo().activeAnimations).toEqual(['test'])
      
      act(() => {
        result.current.markAnimationEnd('test')
      })
      
      expect(result.current.isAnimating()).toBe(false)
    })
  })

  describe('scroll tracking', () => {
    it('should track scroll state', () => {
      const { result } = renderHook(() => useDebouncing())
      
      expect(result.current.isScrolling()).toBe(false)
      
      act(() => {
        result.current.markScrollStart()
      })
      
      expect(result.current.isScrolling()).toBe(true)
      
      act(() => {
        result.current.markScrollEnd()
        vi.advanceTimersByTime(150) // Default scrollEndDelay
      })
      
      expect(result.current.isScrolling()).toBe(false)
    })

    it('should debounce scroll end', () => {
      const { result } = renderHook(() => useDebouncing({ 
        scrollEndDelay: 300 
      }))
      
      act(() => {
        result.current.markScrollStart()
        result.current.markScrollEnd()
      })
      
      // Still scrolling immediately after markScrollEnd
      expect(result.current.isScrolling()).toBe(true)
      
      act(() => {
        vi.advanceTimersByTime(200)
      })
      
      // Still scrolling before delay
      expect(result.current.isScrolling()).toBe(true)
      
      act(() => {
        vi.advanceTimersByTime(100)
      })
      
      // Not scrolling after delay
      expect(result.current.isScrolling()).toBe(false)
    })

    it('should cancel pending scroll end on new scroll start', () => {
      const { result } = renderHook(() => useDebouncing())
      
      act(() => {
        result.current.markScrollStart()
        result.current.markScrollEnd()
        vi.advanceTimersByTime(100) // Partial delay
        result.current.markScrollStart() // New scroll starts
      })
      
      expect(result.current.isScrolling()).toBe(true)
      
      act(() => {
        vi.advanceTimersByTime(200) // Past original delay
      })
      
      // Still scrolling because we restarted
      expect(result.current.isScrolling()).toBe(true)
    })
  })

  describe('isDebouncing', () => {
    it('should return true when animating or scrolling', () => {
      const { result } = renderHook(() => useDebouncing())
      
      expect(result.current.isDebouncing()).toBe(false)
      
      act(() => {
        result.current.markAnimationStart()
      })
      
      expect(result.current.isDebouncing()).toBe(true)
      
      act(() => {
        result.current.markAnimationEnd()
        result.current.markScrollStart()
      })
      
      expect(result.current.isDebouncing()).toBe(true)
    })
  })

  describe('forceReset', () => {
    it('should reset all state', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation()
      const { result } = renderHook(() => useDebouncing())
      
      act(() => {
        result.current.markAnimationStart('test1')
        result.current.markAnimationStart('test2')
        result.current.markScrollStart()
      })
      
      expect(result.current.isAnimating()).toBe(true)
      expect(result.current.isScrolling()).toBe(true)
      
      act(() => {
        result.current.forceReset()
      })
      
      expect(result.current.isAnimating()).toBe(false)
      expect(result.current.isScrolling()).toBe(false)
      expect(result.current.getDebugInfo().activeAnimations).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith('🎯 Force reset executed')
    })
  })

  describe('getDebugInfo', () => {
    it('should return comprehensive debug information', () => {
      const { result } = renderHook(() => useDebouncing())
      
      act(() => {
        result.current.markAnimationStart('hero-exit')
        result.current.markScrollStart()
      })
      
      const debugInfo = result.current.getDebugInfo()
      
      expect(debugInfo).toMatchObject({
        isAnimating: true,
        isScrolling: true,
        activeAnimations: ['hero-exit'],
        canNavigate: false
      })
      expect(debugInfo.timeSinceLastNavigation).toBeGreaterThanOrEqual(0)
    })
  })

  describe('configuration', () => {
    it('should use custom log prefix in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation()
      
      const { result } = renderHook(() => useDebouncing({ 
        debug: true,
        logPrefix: '🚀 TEST'
      }))
      
      act(() => {
        result.current.markAnimationStart()
      })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '🚀 TEST Animation started:',
        'default',
        expect.any(Object)
      )
    })

    it('should not log when debug is false', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation()
      
      const { result } = renderHook(() => useDebouncing({ 
        debug: false 
      }))
      
      act(() => {
        result.current.markAnimationStart()
        result.current.canNavigate()
      })
      
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should clear timeouts on unmount', () => {
      const { result, unmount } = renderHook(() => useDebouncing())
      
      act(() => {
        result.current.markScrollStart()
        result.current.markScrollEnd()
      })
      
      // Unmount before timeout completes
      unmount()
      
      // Advance timers to ensure no errors
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      
      // No errors should occur
      expect(true).toBe(true)
    })
  })

  describe('state closure fix verification', () => {
    it('should maintain current state in async callbacks', async () => {
      const { result } = renderHook(() => useDebouncing())
      
      // Capture canNavigate function
      const canNavigateRef = result.current.canNavigate
      
      // Start animation
      act(() => {
        result.current.markAnimationStart()
      })
      
      // Even if we use the old reference, it should see current state
      expect(canNavigateRef()).toBe(false)
      
      // End animation
      act(() => {
        result.current.markAnimationEnd()
        vi.advanceTimersByTime(200)
      })
      
      // Old reference should still see current state
      expect(canNavigateRef()).toBe(true)
    })
  })
})