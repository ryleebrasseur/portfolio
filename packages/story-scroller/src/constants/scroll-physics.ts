/**
 * Configuration constants for scroll physics and timing
 * Extracted from current implementation for centralized management
 */

/**
 * Core animation timing constants
 */
export const ANIMATION_TIMING = {
  // Base animation duration in seconds
  DEFAULT_DURATION: 1.2,
  
  // Minimum animation duration to prevent jarring transitions
  MIN_DURATION: 0.3,
  
  // Maximum animation duration to prevent sluggish feel
  MAX_DURATION: 2.5,
  
  // Duration multiplier for touch devices
  TOUCH_DURATION_MULTIPLIER: 0.8,
  
  // Lenis duration multiplier (slightly faster for responsiveness)
  LENIS_DURATION_MULTIPLIER: 0.8,
} as const

/**
 * Debounce and cooldown timings
 */
export const DEBOUNCE_TIMING = {
  // Navigation cooldown to prevent rapid section changes
  NAVIGATION_COOLDOWN: 200,
  
  // Delay before considering scroll ended
  SCROLL_END_DELAY: 150,
  
  // Wheel event debounce
  WHEEL_DEBOUNCE: 50,
  
  // State verification interval
  STATE_VERIFICATION_INTERVAL: 500,
  
  // Position check delay after animation
  POSITION_CHECK_DELAY: 100,
  
  // ScrollTrigger config delay to avoid hydration errors
  SCROLLTRIGGER_INIT_DELAY: 0,
} as const

/**
 * Physics and motion parameters
 */
export const MOTION_PHYSICS = {
  // GSAP Observer tolerance to prevent accidental triggers
  OBSERVER_TOLERANCE: 50,
  
  // Touch scroll multiplier
  TOUCH_MULTIPLIER: 2,
  
  // Wheel scroll multiplier (reduced for better control)
  WHEEL_MULTIPLIER: 0.8,
  
  // Lenis lerp (smoothing factor, 0-1, lower = smoother)
  LENIS_LERP: 0.1,
  
  // Magnetic snap threshold (0-1, percentage of viewport)
  MAGNETIC_THRESHOLD: 0.15,
  
  // Velocity threshold for magnetic snap (px/frame)
  MAGNETIC_VELOCITY_THRESHOLD: 5,
  
  // Velocity tracking update rate (ms)
  VELOCITY_TRACKING_RATE: 16, // 60fps
  
  // Maximum velocity for calculations
  MAX_VELOCITY: 50,
  
  // Velocity decay rate
  VELOCITY_DECAY: 0.95,
} as const

/**
 * Scroll position tolerances
 */
export const POSITION_TOLERANCE = {
  // Drift tolerance as percentage of viewport height
  DRIFT_TOLERANCE: 0.1, // 10%
  
  // Absolute drift tolerance in pixels
  DRIFT_TOLERANCE_PX: 50,
  
  // Snap distance threshold
  SNAP_THRESHOLD: 0.3, // 30% of viewport
  
  // Position verification tolerance
  VERIFICATION_TOLERANCE: 1, // 1px
} as const

/**
 * ScrollTrigger configuration
 */
export const SCROLLTRIGGER_CONFIG = {
  // Sync interval for performance
  SYNC_INTERVAL: 40,
  
  // Auto-refresh events
  AUTO_REFRESH_EVENTS: 'visibilitychange,DOMContentLoaded,load',
  
  // Scroller proxy update method
  PROXY_UPDATE_METHOD: 'scrollTop' as const,
} as const

/**
 * Easing functions
 */
export const EASING_FUNCTIONS = {
  // Default exponential ease-out
  DEFAULT: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  
  // Smooth cubic ease-out for natural deceleration
  CUBIC_OUT: (t: number) => 1 - Math.pow(1 - t, 3),
  
  // Power2 ease in-out (GSAP compatible)
  POWER2_INOUT: 'power2.inOut',
  
  // Linear (no easing)
  LINEAR: (t: number) => t,
  
  // Elastic ease for bounce effects
  ELASTIC_OUT: (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
} as const

/**
 * Error recovery thresholds
 */
export const ERROR_RECOVERY = {
  // Maximum error count before emergency reset
  MAX_ERROR_COUNT: 5,
  
  // Maximum recovery attempts
  MAX_RECOVERY_ATTEMPTS: 3,
  
  // Time window for error counting (ms)
  ERROR_COUNT_WINDOW: 5000,
  
  // Stuck animation timeout (ms)
  STUCK_ANIMATION_TIMEOUT: 3000,
} as const

/**
 * Logging and debugging
 */
export const DEBUG_CONFIG = {
  // Enable verbose logging
  VERBOSE: false,
  
  // Log prefixes
  LOG_PREFIX: '🎯 StoryScroller',
  
  // Throttle rate for scroll event logs
  SCROLL_LOG_THROTTLE: 20, // Log every 20th event
  
  // Significant scroll change threshold (px)
  SIGNIFICANT_SCROLL_CHANGE: 20,
} as const

/**
 * CSS class names for styling
 */
export const CSS_CLASSES = {
  // Container classes
  CONTAINER: 'story-scroller',
  CONTAINER_ANIMATING: 'story-scroller--animating',
  CONTAINER_SCROLLING: 'story-scroller--scrolling',
  
  // Section classes
  SECTION: 'story-scroller__section',
  SECTION_ACTIVE: 'story-scroller__section--active',
  SECTION_PREV: 'story-scroller__section--prev',
  SECTION_NEXT: 'story-scroller__section--next',
  
  // State classes
  NARRATIVE_MODE: 'story-scroller--narrative',
  ERROR_STATE: 'story-scroller--error',
} as const

/**
 * Data attributes for DOM queries
 */
export const DATA_ATTRIBUTES = {
  SCROLL_CONTAINER: 'data-scroll-container',
  SECTION_INDEX: 'data-section-index',
  SECTION_ID: 'data-section-id',
  NARRATIVE_CHAPTER: 'data-narrative-chapter',
  NARRATIVE_SCENE: 'data-narrative-scene',
} as const

/**
 * Calculate dynamic values based on viewport
 */
export function calculateDynamicValues(viewportHeight: number) {
  return {
    // Minimum swipe distance to trigger navigation
    minSwipeDistance: viewportHeight * 0.1,
    
    // Maximum scroll offset before correction
    maxScrollOffset: viewportHeight * POSITION_TOLERANCE.DRIFT_TOLERANCE,
    
    // Snap activation distance
    snapActivationDistance: viewportHeight * MOTION_PHYSICS.MAGNETIC_THRESHOLD,
    
    // Section visibility threshold
    sectionVisibilityThreshold: viewportHeight * 0.5,
  }
}

/**
 * Get platform-specific configuration adjustments
 */
export function getPlatformAdjustments() {
  const isTouchDevice = 'ontouchstart' in window
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  
  return {
    // iOS needs special handling for momentum scrolling
    wheelMultiplier: isIOS ? 0.5 : MOTION_PHYSICS.WHEEL_MULTIPLIER,
    
    // Touch devices need different tolerance
    observerTolerance: isTouchDevice ? 100 : MOTION_PHYSICS.OBSERVER_TOLERANCE,
    
    // Safari needs different ScrollTrigger config
    scrollTriggerConfig: isSafari ? {
      ...SCROLLTRIGGER_CONFIG,
      SYNC_INTERVAL: 20, // More frequent updates for Safari
    } : SCROLLTRIGGER_CONFIG,
  }
}