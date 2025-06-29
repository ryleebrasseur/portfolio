import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react'
import { scrollReducer, createInitialState, ScrollState, ScrollAction, scrollActions } from '../state/scrollReducer'
import type { BrowserService } from '../services/BrowserService'

/**
 * Context value shape containing state and dispatch function
 */
interface ScrollContextValue {
  state: ScrollState
  dispatch: React.Dispatch<ScrollAction>
  browserService?: BrowserService
}

/**
 * ScrollContext for sharing state between StoryScroller component and useStoryScroller hook
 */
const ScrollContext = createContext<ScrollContextValue | undefined>(undefined)

/**
 * Props for ScrollProvider
 */
interface ScrollProviderProps {
  children: ReactNode
  /**
   * Optional browser service for dependency injection during testing
   */
  browserService?: BrowserService
  /**
   * Initial state override for testing
   */
  initialState?: Partial<ScrollState>
}

/**
 * ScrollProvider component that provides shared scroll state to all consumers
 */
export const ScrollProvider: React.FC<ScrollProviderProps> = ({ 
  children, 
  browserService,
  initialState 
}) => {
  // Initialize state with optional overrides
  const [state, dispatch] = useReducer(
    scrollReducer, 
    createInitialState(),
    (initial) => ({
      ...initial,
      ...initialState
    })
  )

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<ScrollContextValue>(
    () => ({
      state,
      dispatch,
      browserService
    }),
    [state, browserService]
  )

  return (
    <ScrollContext.Provider value={value}>
      {children}
    </ScrollContext.Provider>
  )
}

/**
 * Hook for accessing scroll context
 * @throws Error if used outside of ScrollProvider
 */
export const useScrollContext = (): ScrollContextValue => {
  const context = useContext(ScrollContext)
  
  if (context === undefined) {
    throw new Error('useScrollContext must be used within a ScrollProvider')
  }
  
  return context
}

/**
 * Type-safe action creators bound to context
 * Provides a convenient API for dispatching actions
 */
export const useScrollActions = () => {
  const { dispatch } = useScrollContext()
  
  return useMemo(
    () => ({
      setClientMounted: () => dispatch(scrollActions.setClientMounted()),
      setPathname: (pathname: string | null) => dispatch(scrollActions.setPathname(pathname)),
      setCurrentIndex: (index: number) => dispatch(scrollActions.setCurrentIndex(index)),
      startAnimation: () => dispatch(scrollActions.startAnimation()),
      endAnimation: () => dispatch(scrollActions.endAnimation()),
      startScrolling: () => dispatch(scrollActions.startScrolling()),
      endScrolling: () => dispatch(scrollActions.endScrolling()),
      updateScrollTime: () => dispatch(scrollActions.updateScrollTime()),
      resetScrollState: () => dispatch(scrollActions.resetScrollState()),
      gotoSection: (index: number, timestamp: number) => dispatch(scrollActions.gotoSection(index, timestamp)),
      setSectionCount: (count: number) => dispatch(scrollActions.setSectionCount(count)),
      resetState: () => dispatch(scrollActions.resetState()),
    }),
    [dispatch]
  )
}

// Export for testing
export { ScrollContext }