import { useCallback, useMemo } from 'react'
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
  
  // Use currentIndex from context state as currentSection
  const currentSection = state.currentIndex
  
  const gotoSection = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(totalSections - 1, index))
    console.log('🎯 useStoryScroller.gotoSection called:', {
      requestedIndex: index,
      clampedIndex,
      currentSection,
      totalSections
    })
    // Dispatch action to update context state
    actions.setCurrentIndex(clampedIndex)
  }, [totalSections, actions, currentSection])
  
  const nextSection = useCallback(() => {
    console.log('➡️ useStoryScroller.nextSection called:', {
      currentSection,
      targetSection: currentSection + 1
    })
    gotoSection(currentSection + 1)
  }, [currentSection, gotoSection])
  
  const prevSection = useCallback(() => {
    console.log('⬅️ useStoryScroller.prevSection called:', {
      currentSection,
      targetSection: currentSection - 1
    })
    gotoSection(currentSection - 1)
  }, [currentSection, gotoSection])
  
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
  
  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    currentSection,
    setCurrentSection,
    gotoSection,
    nextSection,
    prevSection,
    firstSection,
    lastSection,
    isFirstSection: currentSection === 0,
    isLastSection: currentSection === totalSections - 1,
  }), [
    currentSection,
    setCurrentSection,
    gotoSection,
    nextSection,
    prevSection,
    firstSection,
    lastSection,
    totalSections
  ])
}