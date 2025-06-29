import { describe, it, expect } from 'vitest'
import { scrollReducer, createInitialState, scrollActions, scrollSelectors } from './scrollReducer'

describe('scrollReducer', () => {
  describe('initial state', () => {
    it('should create the correct initial state', () => {
      const state = createInitialState()
      expect(state).toEqual({
        currentIndex: 0,
        isAnimating: false,
        lastScrollTime: 0,
        isClient: false,
        pathname: null,
        sectionCount: 0,
      })
    })
  })

  describe('SET_CLIENT_MOUNTED', () => {
    it('should set isClient to true', () => {
      const state = createInitialState()
      const newState = scrollReducer(state, scrollActions.setClientMounted())
      expect(newState.isClient).toBe(true)
    })
  })

  describe('SET_PATHNAME', () => {
    it('should update pathname', () => {
      const state = createInitialState()
      const newState = scrollReducer(state, scrollActions.setPathname('/test'))
      expect(newState.pathname).toBe('/test')
    })

    it('should handle null pathname', () => {
      const state = { ...createInitialState(), pathname: '/test' }
      const newState = scrollReducer(state, scrollActions.setPathname(null))
      expect(newState.pathname).toBe(null)
    })
  })

  describe('Navigation actions', () => {
    it('should start animation', () => {
      const state = createInitialState()
      const newState = scrollReducer(state, scrollActions.startAnimation())
      expect(newState.isAnimating).toBe(true)
    })

    it('should end animation', () => {
      const state = { ...createInitialState(), isAnimating: true }
      const newState = scrollReducer(state, scrollActions.endAnimation())
      expect(newState.isAnimating).toBe(false)
    })

    it('should handle GOTO_SECTION', () => {
      const state = createInitialState()
      const timestamp = Date.now()
      const newState = scrollReducer(state, scrollActions.gotoSection(2, timestamp))
      
      expect(newState.currentIndex).toBe(2)
      expect(newState.isAnimating).toBe(true)
      expect(newState.lastScrollTime).toBe(timestamp)
    })
  })

  describe('Scrolling actions', () => {
    it('should start scrolling and update time', () => {
      const state = createInitialState()
      const before = Date.now()
      const newState = scrollReducer(state, scrollActions.startScrolling())
      const after = Date.now()
      
      // isScrolling state removed - now handled by useDebouncing
      expect(newState.lastScrollTime).toBeGreaterThanOrEqual(before)
      expect(newState.lastScrollTime).toBeLessThanOrEqual(after)
    })

    it('should end scrolling', () => {
      const state = createInitialState()
      const newState = scrollReducer(state, scrollActions.endScrolling())
      // isScrolling removed - handled by useDebouncing
    })
  })

  describe('RESET_SCROLL_STATE', () => {
    it('should reset scroll-related state', () => {
      const state = {
        currentIndex: 5,
        isAnimating: true,
        lastScrollTime: Date.now(),
        isClient: true,
        pathname: '/test',
      }
      const newState = scrollReducer(state, scrollActions.resetScrollState())
      
      expect(newState.currentIndex).toBe(0)
      expect(newState.isAnimating).toBe(false)
      // isScrolling removed - handled by useDebouncing
      expect(newState.lastScrollTime).toBe(0)
      // These should not be reset
      expect(newState.isClient).toBe(true)
      expect(newState.pathname).toBe('/test')
    })
  })

  describe('selectors', () => {
    describe('canNavigate', () => {
      it('should return false when animating', () => {
        const state = { ...createInitialState(), isAnimating: true }
        expect(scrollSelectors.canNavigate(state)).toBe(false)
      })

      it('should return false when scrolled recently', () => {
        const state = { 
          ...createInitialState(), 
          lastScrollTime: Date.now() - 100 // 100ms ago
        }
        expect(scrollSelectors.canNavigate(state)).toBe(false)
      })

      it('should return true when not animating and scroll time is old enough', () => {
        const state = { 
          ...createInitialState(), 
          lastScrollTime: Date.now() - 300 // 300ms ago
        }
        expect(scrollSelectors.canNavigate(state)).toBe(true)
      })
    })

    describe('isReady', () => {
      it('should return false when not client', () => {
        const state = createInitialState()
        expect(scrollSelectors.isReady(state)).toBe(false)
      })

      it('should return true when client', () => {
        const state = { ...createInitialState(), isClient: true }
        expect(scrollSelectors.isReady(state)).toBe(true)
      })
    })
  })

  describe('SET_SECTION_COUNT', () => {
    it('should update section count', () => {
      const state = createInitialState()
      const newState = scrollReducer(state, scrollActions.setSectionCount(5))
      expect(newState.sectionCount).toBe(5)
    })

    it('should handle zero sections', () => {
      const state = { ...createInitialState(), sectionCount: 3 }
      const newState = scrollReducer(state, scrollActions.setSectionCount(0))
      expect(newState.sectionCount).toBe(0)
    })

    it('should handle large section counts', () => {
      const state = createInitialState()
      const newState = scrollReducer(state, scrollActions.setSectionCount(100))
      expect(newState.sectionCount).toBe(100)
    })
  })

  describe('RESET_STATE', () => {
    it('should reset entire state to initial values', () => {
      const state = {
        currentIndex: 5,
        isAnimating: true,
        lastScrollTime: Date.now(),
        isClient: true,
        pathname: '/test',
        sectionCount: 10,
      }
      const newState = scrollReducer(state, scrollActions.resetState())
      
      expect(newState).toEqual(createInitialState())
      expect(newState.currentIndex).toBe(0)
      expect(newState.isAnimating).toBe(false)
      // isScrolling removed - handled by useDebouncing
      expect(newState.lastScrollTime).toBe(0)
      expect(newState.isClient).toBe(false)
      expect(newState.pathname).toBe(null)
      expect(newState.sectionCount).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle negative indices in SET_CURRENT_INDEX', () => {
      const state = createInitialState()
      const newState = scrollReducer(state, scrollActions.setCurrentIndex(-1))
      expect(newState.currentIndex).toBe(-1) // Reducer doesn't validate, that's the component's job
    })

    it('should handle indices larger than section count', () => {
      const state = { ...createInitialState(), sectionCount: 3 }
      const newState = scrollReducer(state, scrollActions.setCurrentIndex(10))
      expect(newState.currentIndex).toBe(10) // Reducer doesn't validate, that's the component's job
    })

    it('should handle negative section counts', () => {
      const state = createInitialState()
      const newState = scrollReducer(state, scrollActions.setSectionCount(-5))
      expect(newState.sectionCount).toBe(-5) // Reducer doesn't validate, that's the component's job
    })

    it('should handle unknown actions by returning current state', () => {
      const state = createInitialState()
      const unknownAction = { type: 'UNKNOWN_ACTION' as 'UNKNOWN_ACTION' }
      const newState = scrollReducer(state, unknownAction)
      expect(newState).toBe(state) // Same reference, no new object created
    })

    it('should maintain state immutability', () => {
      const state = createInitialState()
      const newState = scrollReducer(state, scrollActions.setCurrentIndex(1))
      
      expect(newState).not.toBe(state) // Different objects
      expect(state.currentIndex).toBe(0) // Original unchanged
      expect(newState.currentIndex).toBe(1) // New value
    })

    it('should handle multiple actions in sequence', () => {
      let state = createInitialState()
      
      state = scrollReducer(state, scrollActions.setClientMounted())
      state = scrollReducer(state, scrollActions.setSectionCount(5))
      state = scrollReducer(state, scrollActions.gotoSection(2, Date.now()))
      state = scrollReducer(state, scrollActions.endAnimation())
      
      expect(state.isClient).toBe(true)
      expect(state.sectionCount).toBe(5)
      expect(state.currentIndex).toBe(2)
      expect(state.isAnimating).toBe(false)
    })

    it('should handle concurrent state updates correctly', () => {
      const initialState = createInitialState()
      const timestamp = Date.now()
      
      // Simulate two "concurrent" updates
      const state1 = scrollReducer(initialState, scrollActions.startAnimation())
      const state2 = scrollReducer(initialState, scrollActions.gotoSection(3, timestamp))
      
      // Second update should include animation start
      expect(state1.isAnimating).toBe(true)
      expect(state1.currentIndex).toBe(0)
      
      expect(state2.isAnimating).toBe(true)
      expect(state2.currentIndex).toBe(3)
      expect(state2.lastScrollTime).toBe(timestamp)
    })
  })
})