import { useState, useCallback } from 'react'

/**
 * Hook to manage StoryScroller state and navigation.
 * Provides a simple API for controlling the scroll behavior.
 * 
 * Note: This hook manages state only. The actual scrolling is handled by the
 * StoryScroller component via the onSectionChange callback.
 */
export const useStoryScroller = (totalSections: number) => {
  const [currentSection, setCurrentSection] = useState(0)
  
  const gotoSection = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(totalSections - 1, index))
    setCurrentSection(clampedIndex)
  }, [totalSections])
  
  const nextSection = useCallback(() => {
    gotoSection(currentSection + 1)
  }, [currentSection, gotoSection])
  
  const prevSection = useCallback(() => {
    gotoSection(currentSection - 1)
  }, [currentSection, gotoSection])
  
  const firstSection = useCallback(() => {
    gotoSection(0)
  }, [gotoSection])
  
  const lastSection = useCallback(() => {
    gotoSection(totalSections - 1)
  }, [totalSections, gotoSection])
  
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