import { gsap } from 'gsap'

/**
 * Global animation utilities that respect user preferences
 */

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Animation duration multiplier based on user preference
export const getAnimationDuration = (baseDuration: number): number => {
  return prefersReducedMotion() ? 0 : baseDuration
}

// Ease function that respects user preference
export const getAnimationEase = (
  baseEase: string | gsap.EaseFunction
): string | gsap.EaseFunction => {
  return prefersReducedMotion() ? 'none' : baseEase
}

// Wrapper for GSAP animations that respects reduced motion
export const animateTo = (
  target: gsap.TweenTarget,
  vars: gsap.TweenVars
): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    // Skip to end state immediately
    return gsap.set(target, {
      ...vars,
      duration: 0,
      delay: 0,
      ease: 'none',
      onComplete: vars.onComplete,
    })
  }
  return gsap.to(target, vars)
}

export const animateFrom = (
  target: gsap.TweenTarget,
  vars: gsap.TweenVars
): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    // Skip animation
    return gsap.set(target, {
      ...vars,
      duration: 0,
      delay: 0,
      ease: 'none',
      onComplete: vars.onComplete,
    })
  }
  return gsap.from(target, vars)
}

export const animateFromTo = (
  target: gsap.TweenTarget,
  fromVars: gsap.TweenVars,
  toVars: gsap.TweenVars
): gsap.core.Tween => {
  if (prefersReducedMotion()) {
    // Skip to end state
    return gsap.set(target, {
      ...toVars,
      duration: 0,
      delay: 0,
      ease: 'none',
      onComplete: toVars.onComplete,
    })
  }
  return gsap.fromTo(target, fromVars, toVars)
}

// Timeline wrapper that respects reduced motion
export const createTimeline = (
  vars?: gsap.TimelineVars
): gsap.core.Timeline => {
  if (prefersReducedMotion()) {
    return gsap.timeline({
      ...vars,
      defaults: {
        duration: 0,
        ease: 'none',
      },
    })
  }
  return gsap.timeline(vars)
}

// CSS transition duration based on preference
export const getCSSTransitionDuration = (baseDuration: string): string => {
  return prefersReducedMotion() ? '0s' : baseDuration
}

// Debounce utility for performance-critical events (following StoryScroller patterns)
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Hook to listen for preference changes
export const onMotionPreferenceChange = (
  callback: (prefersReduced: boolean) => void
) => {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Create a proper event listener wrapper
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    callback('matches' in e ? e.matches : false)
  }

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange)
  } else {
    // Legacy browsers
    mediaQuery.addListener(handleChange)
  }

  // Return cleanup function
  return () => {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleChange)
    } else {
      mediaQuery.removeListener(handleChange)
    }
  }
}
