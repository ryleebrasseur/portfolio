import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useStoryScroller } from '../src/hooks/useStoryScroller'

describe('useStoryScroller Hook', () => {
  it('initializes with correct values', () => {
    const { result } = renderHook(() => useStoryScroller(5))
    
    expect(result.current.currentSection).toBe(0)
    expect(result.current.isFirstSection).toBe(true)
    expect(result.current.isLastSection).toBe(false)
  })

  it('navigates to next section', () => {
    const { result } = renderHook(() => useStoryScroller(5))
    
    act(() => {
      result.current.nextSection()
    })
    
    expect(result.current.currentSection).toBe(1)
    expect(result.current.isFirstSection).toBe(false)
    expect(result.current.isLastSection).toBe(false)
  })

  it('navigates to previous section', () => {
    const { result } = renderHook(() => useStoryScroller(5))
    
    // First go to section 2
    act(() => {
      result.current.gotoSection(2)
    })
    
    expect(result.current.currentSection).toBe(2)
    
    // Then go back
    act(() => {
      result.current.prevSection()
    })
    
    expect(result.current.currentSection).toBe(1)
  })

  it('navigates to specific section', () => {
    const { result } = renderHook(() => useStoryScroller(5))
    
    act(() => {
      result.current.gotoSection(3)
    })
    
    expect(result.current.currentSection).toBe(3)
  })

  it('clamps section index to valid range', () => {
    const { result } = renderHook(() => useStoryScroller(5))
    
    // Try to go past the end
    act(() => {
      result.current.gotoSection(10)
    })
    
    expect(result.current.currentSection).toBe(4) // Last section (0-indexed)
    
    // Try to go before the start
    act(() => {
      result.current.gotoSection(-5)
    })
    
    expect(result.current.currentSection).toBe(0)
  })

  it('correctly identifies first and last sections', () => {
    const { result } = renderHook(() => useStoryScroller(3))
    
    // At first section
    expect(result.current.isFirstSection).toBe(true)
    expect(result.current.isLastSection).toBe(false)
    
    // Go to middle section
    act(() => {
      result.current.gotoSection(1)
    })
    
    expect(result.current.isFirstSection).toBe(false)
    expect(result.current.isLastSection).toBe(false)
    
    // Go to last section
    act(() => {
      result.current.gotoSection(2)
    })
    
    expect(result.current.isFirstSection).toBe(false)
    expect(result.current.isLastSection).toBe(true)
  })

  it('navigates to first section', () => {
    const { result } = renderHook(() => useStoryScroller(5))
    
    // Go to middle section first
    act(() => {
      result.current.gotoSection(3)
    })
    
    // Then go to first
    act(() => {
      result.current.firstSection()
    })
    
    expect(result.current.currentSection).toBe(0)
    expect(result.current.isFirstSection).toBe(true)
  })

  it('navigates to last section', () => {
    const { result } = renderHook(() => useStoryScroller(5))
    
    act(() => {
      result.current.lastSection()
    })
    
    expect(result.current.currentSection).toBe(4)
    expect(result.current.isLastSection).toBe(true)
  })

  it('prevents navigation past boundaries', () => {
    const { result } = renderHook(() => useStoryScroller(3))
    
    // Try to go before first
    act(() => {
      result.current.prevSection()
    })
    
    expect(result.current.currentSection).toBe(0)
    
    // Go to last section
    act(() => {
      result.current.lastSection()
    })
    
    // Try to go past last
    act(() => {
      result.current.nextSection()
    })
    
    expect(result.current.currentSection).toBe(2)
  })

  it('handles single section', () => {
    const { result } = renderHook(() => useStoryScroller(1))
    
    expect(result.current.currentSection).toBe(0)
    expect(result.current.isFirstSection).toBe(true)
    expect(result.current.isLastSection).toBe(true)
    
    // Navigation should stay at 0
    act(() => {
      result.current.nextSection()
    })
    
    expect(result.current.currentSection).toBe(0)
  })

  it('updates when setCurrentSection is called directly', () => {
    const { result } = renderHook(() => useStoryScroller(5))
    
    act(() => {
      result.current.setCurrentSection(3)
    })
    
    expect(result.current.currentSection).toBe(3)
  })
  
  it('returns all expected properties', () => {
    const { result } = renderHook(() => useStoryScroller(5))
    
    expect(result.current).toHaveProperty('currentSection')
    expect(result.current).toHaveProperty('setCurrentSection')
    expect(result.current).toHaveProperty('gotoSection')
    expect(result.current).toHaveProperty('nextSection')
    expect(result.current).toHaveProperty('prevSection')
    expect(result.current).toHaveProperty('firstSection')
    expect(result.current).toHaveProperty('lastSection')
    expect(result.current).toHaveProperty('isFirstSection')
    expect(result.current).toHaveProperty('isLastSection')
  })
})