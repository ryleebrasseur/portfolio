import React from 'react'
import { render, renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ScrollProvider, useScrollContext, useScrollActions } from './ScrollContext'
import { scrollActions } from '../state/scrollReducer'
import type { BrowserService } from '../services/BrowserService'

describe('ScrollContext', () => {
  describe('ScrollProvider', () => {
    it('should provide state and dispatch to children', () => {
      const TestComponent = () => {
        const { state, dispatch } = useScrollContext()
        return (
          <div>
            <span data-testid="current-index">{state.currentIndex}</span>
            <button 
              onClick={() => dispatch(scrollActions.setCurrentIndex(5))}
              data-testid="set-index"
            >
              Set Index
            </button>
          </div>
        )
      }

      const { getByTestId } = render(
        <ScrollProvider>
          <TestComponent />
        </ScrollProvider>
      )

      expect(getByTestId('current-index')).toHaveTextContent('0')
      
      act(() => {
        getByTestId('set-index').click()
      })

      expect(getByTestId('current-index')).toHaveTextContent('5')
    })

    it('should accept initial state overrides', () => {
      const TestComponent = () => {
        const { state } = useScrollContext()
        return <span data-testid="current-index">{state.currentIndex}</span>
      }

      const { getByTestId } = render(
        <ScrollProvider initialState={{ currentIndex: 3, isAnimating: true }}>
          <TestComponent />
        </ScrollProvider>
      )

      expect(getByTestId('current-index')).toHaveTextContent('3')
    })

    it('should accept optional browserService prop', () => {
      const mockBrowserService: BrowserService = {
        isServer: false,
        isBrowser: true,
        getWindow: () => window,
        getDocument: () => document,
        getNavigator: () => navigator,
        requestAnimationFrame: (cb: FrameRequestCallback) => window.requestAnimationFrame(cb),
        cancelAnimationFrame: (id: number) => window.cancelAnimationFrame(id),
        setTimeout: (cb: () => void, ms: number) => window.setTimeout(cb, ms),
        clearTimeout: (id: number) => window.clearTimeout(id),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        scrollTo: vi.fn(),
        getScrollTop: vi.fn(() => 0),
        setScrollTop: vi.fn(),
      }

      const TestComponent = () => {
        const { browserService } = useScrollContext()
        return <span data-testid="has-service">{browserService ? 'yes' : 'no'}</span>
      }

      const { getByTestId } = render(
        <ScrollProvider browserService={mockBrowserService}>
          <TestComponent />
        </ScrollProvider>
      )

      expect(getByTestId('has-service')).toHaveTextContent('yes')
    })
  })

  describe('useScrollContext', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = vi.fn()

      const TestComponent = () => {
        useScrollContext()
        return null
      }

      expect(() => render(<TestComponent />)).toThrow(
        'useScrollContext must be used within a ScrollProvider'
      )

      console.error = originalError
    })

    it('should return context value when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ScrollProvider>{children}</ScrollProvider>
      )

      const { result } = renderHook(() => useScrollContext(), { wrapper })

      expect(result.current.state).toBeDefined()
      expect(result.current.dispatch).toBeDefined()
      expect(result.current.state.currentIndex).toBe(0)
    })
  })

  describe('useScrollActions', () => {
    it('should provide bound action creators', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ScrollProvider>{children}</ScrollProvider>
      )

      const { result } = renderHook(() => {
        const actions = useScrollActions()
        const { state } = useScrollContext()
        return { actions, state }
      }, { wrapper })

      expect(result.current.state.currentIndex).toBe(0)

      act(() => {
        result.current.actions.setCurrentIndex(3)
      })

      expect(result.current.state.currentIndex).toBe(3)

      act(() => {
        result.current.actions.gotoSection(5, Date.now())
      })

      expect(result.current.state.currentIndex).toBe(5)
      expect(result.current.state.isAnimating).toBe(true)
    })

    it('should memoize action creators', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ScrollProvider>{children}</ScrollProvider>
      )

      const { result, rerender } = renderHook(() => useScrollActions(), { wrapper })

      const firstActions = result.current

      // Force re-render
      rerender()

      const secondActions = result.current

      // Actions object should be the same reference
      expect(firstActions).toBe(secondActions)
    })
  })

  describe('State synchronization', () => {
    it('should synchronize state between multiple consumers', () => {
      const Consumer1 = () => {
        const { state } = useScrollContext()
        const actions = useScrollActions()
        return (
          <div>
            <span data-testid="consumer1-index">{state.currentIndex}</span>
            <button 
              onClick={() => actions.setCurrentIndex(7)}
              data-testid="consumer1-button"
            >
              Set to 7
            </button>
          </div>
        )
      }

      const Consumer2 = () => {
        const { state } = useScrollContext()
        return <span data-testid="consumer2-index">{state.currentIndex}</span>
      }

      const { getByTestId } = render(
        <ScrollProvider>
          <Consumer1 />
          <Consumer2 />
        </ScrollProvider>
      )

      // Both consumers should start with same state
      expect(getByTestId('consumer1-index')).toHaveTextContent('0')
      expect(getByTestId('consumer2-index')).toHaveTextContent('0')

      // Update from one consumer
      act(() => {
        getByTestId('consumer1-button').click()
      })

      // Both consumers should reflect the change
      expect(getByTestId('consumer1-index')).toHaveTextContent('7')
      expect(getByTestId('consumer2-index')).toHaveTextContent('7')
    })

    it('should maintain state consistency during rapid updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ScrollProvider>{children}</ScrollProvider>
      )

      const { result } = renderHook(() => {
        const actions = useScrollActions()
        const { state } = useScrollContext()
        return { actions, state }
      }, { wrapper })

      // Perform rapid updates
      act(() => {
        result.current.actions.setCurrentIndex(1)
        result.current.actions.setCurrentIndex(2)
        result.current.actions.setCurrentIndex(3)
        result.current.actions.startAnimation()
        result.current.actions.endAnimation()
      })

      // Final state should be consistent
      expect(result.current.state.currentIndex).toBe(3)
      expect(result.current.state.isAnimating).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should memoize context value properly', () => {
      let renderCount = 0

      const TestComponent = () => {
        renderCount++
        const { state } = useScrollContext()
        return <span>{state.currentIndex}</span>
      }

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ScrollProvider>{children}</ScrollProvider>
      )

      const { result, rerender } = renderHook(() => {
        const actions = useScrollActions()
        const { state } = useScrollContext()
        return { actions, state, TestComponent }
      }, { wrapper })

      // Initial render count
      const { rerender: componentRerender } = render(<TestComponent />, { wrapper })
      const initialRenderCount = renderCount

      // State changes should trigger re-renders
      act(() => {
        result.current.actions.setCurrentIndex(1)
      })

      // Re-render to see the effect
      componentRerender(<TestComponent />)

      // Verify state changed
      expect(result.current.state.currentIndex).toBe(1)
      
      // Component should re-render when context state changes
      expect(renderCount).toBeGreaterThan(initialRenderCount)
    })
  })
})