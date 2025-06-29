/**
 * State management for StoryScroller using the reducer pattern.
 * Consolidates all state transitions into explicit, traceable actions.
 */

/**
 * Complete state for the StoryScroller component
 */
export interface ScrollState {
  // Navigation state
  currentIndex: number
  isAnimating: boolean
  isScrolling: boolean
  lastScrollTime: number
  
  // Environment state
  isClient: boolean
  pathname: string | null
  sectionCount: number
}

/**
 * Action types for all possible state transitions
 */
export type ScrollAction =
  | { type: 'SET_CLIENT_MOUNTED' }
  | { type: 'SET_PATHNAME'; payload: string | null }
  | { type: 'SET_CURRENT_INDEX'; payload: number }
  | { type: 'START_ANIMATION' }
  | { type: 'END_ANIMATION' }
  | { type: 'START_SCROLLING' }
  | { type: 'END_SCROLLING' }
  | { type: 'UPDATE_SCROLL_TIME' }
  | { type: 'RESET_SCROLL_STATE' }
  | { type: 'GOTO_SECTION'; payload: { index: number; timestamp: number } }
  | { type: 'SET_SECTION_COUNT'; payload: number }
  | { type: 'RESET_STATE' }

/**
 * Initial state factory
 */
export const createInitialState = (): ScrollState => ({
  currentIndex: 0,
  isAnimating: false,
  isScrolling: false,
  lastScrollTime: 0,
  isClient: false,
  pathname: null,
  sectionCount: 0,
})

/**
 * Reducer function to handle all state transitions
 */
export function scrollReducer(state: ScrollState, action: ScrollAction): ScrollState {
  switch (action.type) {
    case 'SET_CLIENT_MOUNTED':
      return {
        ...state,
        isClient: true,
      }
      
    case 'SET_PATHNAME':
      return {
        ...state,
        pathname: action.payload,
      }
      
    case 'SET_CURRENT_INDEX':
      return {
        ...state,
        currentIndex: action.payload,
      }
      
    case 'START_ANIMATION':
      return {
        ...state,
        isAnimating: true,
      }
      
    case 'END_ANIMATION':
      return {
        ...state,
        isAnimating: false,
      }
      
    case 'START_SCROLLING':
      return {
        ...state,
        isScrolling: true,
        lastScrollTime: Date.now(),
      }
      
    case 'END_SCROLLING':
      return {
        ...state,
        isScrolling: false,
      }
      
    case 'UPDATE_SCROLL_TIME':
      return {
        ...state,
        lastScrollTime: Date.now(),
      }
      
    case 'RESET_SCROLL_STATE':
      return {
        ...state,
        currentIndex: 0,
        isAnimating: false,
        isScrolling: false,
        lastScrollTime: 0,
      }
      
    case 'GOTO_SECTION':
      // Combined action for section navigation
      return {
        ...state,
        currentIndex: action.payload.index,
        isAnimating: true,
        lastScrollTime: action.payload.timestamp,
      }
      
    case 'SET_SECTION_COUNT':
      return {
        ...state,
        sectionCount: action.payload,
      }
      
    case 'RESET_STATE':
      // Complete state reset to initial values
      return createInitialState()
      
    default:
      // Exhaustive check - ensures all action types are handled
      return state
  }
}

/**
 * Action creators for type-safe dispatching
 */
export const scrollActions = {
  setClientMounted: (): ScrollAction => ({ type: 'SET_CLIENT_MOUNTED' }),
  setPathname: (pathname: string | null): ScrollAction => ({ type: 'SET_PATHNAME', payload: pathname }),
  setCurrentIndex: (index: number): ScrollAction => ({ type: 'SET_CURRENT_INDEX', payload: index }),
  startAnimation: (): ScrollAction => ({ type: 'START_ANIMATION' }),
  endAnimation: (): ScrollAction => ({ type: 'END_ANIMATION' }),
  startScrolling: (): ScrollAction => ({ type: 'START_SCROLLING' }),
  endScrolling: (): ScrollAction => ({ type: 'END_SCROLLING' }),
  updateScrollTime: (): ScrollAction => ({ type: 'UPDATE_SCROLL_TIME' }),
  resetScrollState: (): ScrollAction => ({ type: 'RESET_SCROLL_STATE' }),
  gotoSection: (index: number, timestamp: number): ScrollAction => ({ 
    type: 'GOTO_SECTION', 
    payload: { index, timestamp } 
  }),
  setSectionCount: (count: number): ScrollAction => ({ type: 'SET_SECTION_COUNT', payload: count }),
  resetState: (): ScrollAction => ({ type: 'RESET_STATE' }),
}

/**
 * Selectors for accessing state properties
 */
export const scrollSelectors = {
  canNavigate: (state: ScrollState): boolean => {
    return !state.isAnimating && (Date.now() - state.lastScrollTime > 200)
  },
  isReady: (state: ScrollState): boolean => {
    return state.isClient
  },
}