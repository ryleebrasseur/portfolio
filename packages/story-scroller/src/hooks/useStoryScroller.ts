import { useCallback } from 'react'
import { useScrollContext, useScrollActions } from '../context/ScrollContext'

/**
 * Hook to manage StoryScroller state and navigation.
 * Provides a simple API for controlling the scroll behavior.
 * 
 * This hook uses the shared ScrollContext to ensure state synchronization
 * with the StoryScroller component.
 * 
 * @throws Error if used outside of ScrollProvider
 */
export const useStoryScroller = (totalSections: number) => {
  const { state } = useScrollContext()
  const actions = useScrollActions()
  
  const gotoSection = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(totalSections - 1, index))
    console.log('🎯 useStoryScroller.gotoSection called:', {
      requestedIndex: index,
      clampedIndex,
      currentIndex: state.currentIndex,
      totalSections
    })
    // Dispatch action to update context state
    actions.setCurrentIndex(clampedIndex)
  }, [totalSections, actions, state.currentIndex])
  
  const nextSection = useCallback(() => {
    const current = state.currentIndex || 0
    const target = current + 1
    console.log('➡️ useStoryScroller.nextSection called:', {
      currentSection: current,
      targetSection: target
    })
    gotoSection(target)
  }, [state.currentIndex, gotoSection])
  
  const prevSection = useCallback(() => {
    const current = state.currentIndex || 0
    const target = current - 1
    console.log('⬅️ useStoryScroller.prevSection called:', {
      currentSection: current,
      targetSection: target
    })
    gotoSection(target)
  }, [state.currentIndex, gotoSection])
  
  const firstSection = useCallback(() => {
    gotoSection(0)
  }, [gotoSection])
  
  const lastSection = useCallback(() => {
    gotoSection(totalSections - 1)
  }, [totalSections, gotoSection])
  
  // Expose setCurrentSection for compatibility, but use context dispatch
  const setCurrentSection = useCallback((index: number) => {
    actions.setCurrentIndex(index)
  }, [actions])
  
  // Use currentIndex directly from state, no memoization to avoid circular deps
  const currentSection = state.currentIndex || 0
  
  return {
    currentSection,
    setCurrentSection,
    gotoSection,
    nextSection,
    prevSection,
    firstSection,
    lastSection,
    isFirstSection: currentSection === 0,
    isLastSection: currentSection === totalSections - 1,
  }
}