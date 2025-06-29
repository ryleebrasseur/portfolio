# useDebouncing API Design & Validation

**Date:** 2025-06-29  
**Purpose:** Design and validate useDebouncing API against all current use cases  
**Goal:** Foundation for narrative portfolio with full motion support during transitions

## Executive Summary

This document validates the useDebouncing API design against all current debouncing use cases in StoryScroller v2. The new API must fix state closure bugs while maintaining all existing functionality and preparing for complex motion choreography.

## Current Debouncing Implementation Analysis

### 1. State Management (scrollReducer.ts)
```typescript
// Current timing state mixed with application state
interface ScrollState {
  isAnimating: boolean      // Animation in progress
  isScrolling: boolean      // Scroll gesture active
  lastScrollTime: number    // Timestamp for cooldown
}

// Current selector combining multiple concerns
canNavigate: (state) => !state.isAnimating && (Date.now() - state.lastScrollTime > 200)
```

**Problems Identified:**
- **State closure**: Values captured at render time, not current in callbacks
- **Mixed concerns**: Timing logic coupled with application state
- **Hard-coded values**: 200ms cooldown not configurable
- **Multiple sources**: Animation/scroll state tracked separately

### 2. Current Usage in StoryScroller.tsx

#### 2.1 Navigation Gating
```typescript
// Line 233: gotoSection function
if (!scrollSelectors.canNavigate(state)) {
  console.log('❌ Navigation blocked - cannot navigate')
  return
}
```

#### 2.2 Observer Debouncing  
```typescript
// Lines 352-356: Observer onDown
if (isScrolling.current || state.isAnimating) {
  console.log('❌ Observer onDown blocked - already scrolling/animating')
  return
}
```

#### 2.3 State Updates
```typescript
// Various locations
actions.startAnimation()
actions.endAnimation()
actions.startScrolling()
actions.endScrolling()
```

#### 2.4 ScrollEnd Detection
```typescript
// Lines 192-196: ScrollTrigger scrollEnd
ScrollTrigger.addEventListener('scrollEnd', scrollEndHandler)
// Sets isScrolling.current = false
```

### 3. Timing Requirements

From performance baseline analysis:
- **Navigation cooldown**: 200ms minimum between navigations
- **Animation duration**: 1.5s default for section transitions
- **Scroll end detection**: Via ScrollTrigger event
- **Observer tolerance**: 50 (reduced to 25 for better response)
- **Event throttling**: 60fps max (16ms intervals)

## Proposed useDebouncing API Design

### 1. Core Interface
```typescript
interface DebounceConfig {
  // Timing configuration
  navigationCooldown?: number      // Min time between navigations (default: 200)
  animationDuration?: number       // Expected animation time (default: 1500)
  scrollEndDelay?: number         // Delay before marking scroll end (default: 150)
  
  // Behavior configuration
  preventOverlap?: boolean        // Prevent overlapping animations (default: true)
  trackMomentum?: boolean         // Track momentum scrolling (default: true)
  
  // Debug configuration
  debug?: boolean                 // Enable debug logging (default: false)
  logPrefix?: string             // Custom log prefix (default: '🎯')
}

interface DebounceState {
  canNavigate: () => boolean
  isAnimating: () => boolean
  isScrolling: () => boolean
  isDebouncing: () => boolean
  
  // State transitions
  markAnimationStart: (id?: string) => void
  markAnimationEnd: (id?: string) => void
  markScrollStart: () => void
  markScrollEnd: () => void
  
  // Advanced controls
  forceReset: () => void
  getDebugInfo: () => DebugInfo
}

export function useDebouncing(config?: DebounceConfig): DebounceState
```

### 2. Implementation Strategy

#### 2.1 State Management with Refs (Fixes Closure Bug)
```typescript
export function useDebouncing(config: DebounceConfig = {}): DebounceState {
  // All state in refs to avoid closure issues
  const animatingRef = useRef(false)
  const scrollingRef = useRef(false)
  const lastNavigationRef = useRef(0)
  const activeAnimationsRef = useRef<Set<string>>(new Set())
  
  // Configuration with defaults
  const configRef = useRef({
    navigationCooldown: 200,
    animationDuration: 1500,
    scrollEndDelay: 150,
    preventOverlap: true,
    trackMomentum: true,
    debug: false,
    logPrefix: '🎯',
    ...config
  })
```

#### 2.2 Core Navigation Control
```typescript
const canNavigate = useCallback(() => {
  const now = Date.now()
  const timeSinceLastNav = now - lastNavigationRef.current
  const cooldownMet = timeSinceLastNav >= configRef.current.navigationCooldown
  const notAnimating = !animatingRef.current
  const notScrolling = !scrollingRef.current
  
  if (configRef.current.debug) {
    console.log(`${configRef.current.logPrefix} canNavigate:`, {
      cooldownMet,
      notAnimating,
      notScrolling,
      timeSinceLastNav,
      result: cooldownMet && notAnimating && notScrolling
    })
  }
  
  return cooldownMet && notAnimating && notScrolling
}, [])
```

#### 2.3 Animation Tracking (Named Animations)
```typescript
const markAnimationStart = useCallback((id?: string) => {
  const animId = id || 'default'
  activeAnimationsRef.current.add(animId)
  animatingRef.current = true
  lastNavigationRef.current = Date.now()
  
  if (configRef.current.debug) {
    console.log(`${configRef.current.logPrefix} Animation started:`, animId)
  }
}, [])

const markAnimationEnd = useCallback((id?: string) => {
  const animId = id || 'default'
  activeAnimationsRef.current.delete(animId)
  
  if (activeAnimationsRef.current.size === 0) {
    animatingRef.current = false
  }
  
  if (configRef.current.debug) {
    console.log(`${configRef.current.logPrefix} Animation ended:`, animId, {
      remainingAnimations: activeAnimationsRef.current.size
    })
  }
}, [])
```

#### 2.4 Scroll State Management
```typescript
const scrollEndTimeoutRef = useRef<NodeJS.Timeout>()

const markScrollStart = useCallback(() => {
  scrollingRef.current = true
  
  // Clear any pending scroll end
  if (scrollEndTimeoutRef.current) {
    clearTimeout(scrollEndTimeoutRef.current)
  }
  
  if (configRef.current.debug) {
    console.log(`${configRef.current.logPrefix} Scroll started`)
  }
}, [])

const markScrollEnd = useCallback(() => {
  // Debounce scroll end to handle momentum
  if (scrollEndTimeoutRef.current) {
    clearTimeout(scrollEndTimeoutRef.current)
  }
  
  scrollEndTimeoutRef.current = setTimeout(() => {
    scrollingRef.current = false
    if (configRef.current.debug) {
      console.log(`${configRef.current.logPrefix} Scroll ended (debounced)`)
    }
  }, configRef.current.scrollEndDelay)
}, [])
```

### 3. Integration Points

#### 3.1 StoryScroller Integration
```typescript
// In StoryScroller component
const debouncing = useDebouncing({
  navigationCooldown: 200,
  animationDuration: duration * 1000,
  debug: true,
  logPrefix: '🚀 StoryScroller'
})

// Replace current checks
if (!debouncing.canNavigate()) {
  console.log('❌ Navigation blocked by debouncing')
  return
}

// Replace state updates
debouncing.markAnimationStart('section-transition')
gsap.to(window, {
  scrollTo: targetY,
  duration,
  onComplete: () => {
    debouncing.markAnimationEnd('section-transition')
  }
})
```

#### 3.2 Observer Integration
```typescript
observer = Observer.create({
  onDown: () => {
    if (!debouncing.canNavigate()) {
      if (wheelEventCount % 50 === 0) { // Throttle logs
        console.log('❌ Observer blocked by debouncing')
      }
      return
    }
    
    debouncing.markScrollStart()
    gotoSection(currentIndex + 1)
  }
})
```

#### 3.3 ScrollTrigger Integration
```typescript
ScrollTrigger.addEventListener('scrollEnd', () => {
  debouncing.markScrollEnd()
})
```

### 4. Advanced Features for Motion Choreography

#### 4.1 Named Animation Tracking
Supports multiple concurrent animations:
```typescript
debouncing.markAnimationStart('hero-exit')
debouncing.markAnimationStart('content-enter')
// Navigation blocked until BOTH complete
debouncing.markAnimationEnd('hero-exit')
debouncing.markAnimationEnd('content-enter')
```

#### 4.2 Debug Information
```typescript
interface DebugInfo {
  isAnimating: boolean
  isScrolling: boolean
  activeAnimations: string[]
  timeSinceLastNavigation: number
  canNavigate: boolean
}

const getDebugInfo = (): DebugInfo => ({
  isAnimating: animatingRef.current,
  isScrolling: scrollingRef.current,
  activeAnimations: Array.from(activeAnimationsRef.current),
  timeSinceLastNavigation: Date.now() - lastNavigationRef.current,
  canNavigate: canNavigate()
})
```

#### 4.3 Force Reset (Emergency)
```typescript
const forceReset = useCallback(() => {
  animatingRef.current = false
  scrollingRef.current = false
  activeAnimationsRef.current.clear()
  lastNavigationRef.current = 0
  
  if (scrollEndTimeoutRef.current) {
    clearTimeout(scrollEndTimeoutRef.current)
  }
  
  console.warn(`${configRef.current.logPrefix} Force reset executed`)
}, [])
```

### 5. Migration Path from v2

#### 5.1 scrollReducer Changes
```typescript
// REMOVE from ScrollState:
- isAnimating: boolean
- isScrolling: boolean  
- lastScrollTime: number

// REMOVE actions:
- START_ANIMATION
- END_ANIMATION
- START_SCROLLING
- END_SCROLLING
- UPDATE_SCROLL_TIME

// REMOVE from selectors:
- canNavigate // Replaced by debouncing.canNavigate()
```

#### 5.2 StoryScroller Changes
```typescript
// REMOVE:
- const isScrolling = useRef(false)
- Direct state.isAnimating checks
- actions.startAnimation() calls

// ADD:
+ const debouncing = useDebouncing(debouncingConfig)
+ Use debouncing methods throughout
```

### 6. Benefits of This Design

#### 6.1 Fixes State Closure Bugs ✅
- All state in refs, always current
- No stale closures in callbacks
- Consistent state across all consumers

#### 6.2 Separation of Concerns ✅
- Timing logic isolated from application state
- Testable in isolation
- Reusable across components

#### 6.3 Extensibility for Motion ✅
- Named animations support complex choreography
- Concurrent animation tracking
- Debug tools for complex scenarios

#### 6.4 Production Ready ✅
- Configurable timeouts
- Emergency reset capability
- Comprehensive debug logging
- Memory leak prevention

### 7. Risk Mitigation

#### 7.1 Backward Compatibility
- Public API unchanged (StoryScroller props same)
- Internal refactor only
- Gradual migration possible

#### 7.2 Testing Strategy
- Unit test all debouncing methods
- Integration test with StoryScroller
- Performance regression testing
- Cross-browser validation

#### 7.3 Rollback Plan
- Git branch preservation
- Feature flag for A/B testing
- Quick revert procedures documented

## Validation Against Requirements

### ✅ **Fixes Current Issues**
- **State closure bugs**: Refs ensure current values
- **Mixed concerns**: Clean separation achieved
- **Hard-coded values**: Fully configurable
- **Testing difficulties**: Isolated, testable hook

### ✅ **Maintains Functionality**
- **Navigation gating**: canNavigate() replacement
- **Animation tracking**: Start/end methods
- **Scroll detection**: ScrollTrigger integration
- **Debug logging**: Enhanced capabilities

### ✅ **Enables Future Vision**
- **Complex choreography**: Named animation support
- **Motion transitions**: Concurrent tracking
- **Production scale**: Performance optimized
- **Developer experience**: Clear, intuitive API

## Conclusion

The useDebouncing API design successfully addresses all current use cases while providing a solid foundation for complex motion choreography in narrative portfolios. It fixes the critical state closure bugs, separates concerns properly, and maintains all existing functionality while adding powerful new capabilities for the future.

This design is ready for implementation as Phase 1 of the v3 refactor.