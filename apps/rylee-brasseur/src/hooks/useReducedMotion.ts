import { useState, useEffect } from 'react'
import { onMotionPreferenceChange } from '../utils/animation'

/**
 * React hook to track user's motion preference
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    // Listen for changes to the preference
    const cleanup = onMotionPreferenceChange((prefersReduced) => {
      setPrefersReducedMotion(prefersReduced)
    })

    return cleanup
  }, [])

  return prefersReducedMotion
}
