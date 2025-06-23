import { useEffect, useState, useCallback, useRef } from 'react'
import { useMotion } from '../providers/MotionProvider'
import { ScrollStateMachineOptions } from '../types'

export interface ScrollState {
  currentChapter: string
  previousChapter: string | null
  nextChapter: string | null
  isTransitioning: boolean
  transitionProgress: number
  direction: 'forward' | 'backward' | 'idle'
}

export const useScrollStateMachine = (options: ScrollStateMachineOptions) => {
  const { chapters, onChapterChange } = options
  const { scrollProgress, velocity, currentChapter } = useMotion()

  const [state, setState] = useState<ScrollState>({
    currentChapter: chapters[0]?.id || '',
    previousChapter: null,
    nextChapter: chapters[1]?.id || null,
    isTransitioning: false,
    transitionProgress: 0,
    direction: 'idle',
  })

  const previousChapterRef = useRef<string>(chapters[0]?.id || '')
  const transitionTimeoutRef = useRef<NodeJS.Timeout>()

  // Determine scroll direction
  const getDirection = useCallback(
    (velocity: number): 'forward' | 'backward' | 'idle' => {
      if (Math.abs(velocity) < 0.01) return 'idle'
      return velocity > 0 ? 'forward' : 'backward'
    },
    []
  )

  // Find adjacent chapters
  const getAdjacentChapters = useCallback(
    (chapterId: string) => {
      const currentIndex = chapters.findIndex((ch) => ch.id === chapterId)
      const previous = currentIndex > 0 ? chapters[currentIndex - 1].id : null
      const next =
        currentIndex < chapters.length - 1
          ? chapters[currentIndex + 1].id
          : null
      return { previous, next }
    },
    [chapters]
  )

  // Calculate transition progress between chapters
  const getTransitionProgress = useCallback(
    (scrollProgress: number, fromChapter: string, toChapter: string) => {
      const fromChapterData = chapters.find((ch) => ch.id === fromChapter)
      const toChapterData = chapters.find((ch) => ch.id === toChapter)

      if (!fromChapterData || !toChapterData) return 0

      // Calculate overlap zone
      const overlapStart = Math.max(fromChapterData.start, toChapterData.start)
      const overlapEnd = Math.min(fromChapterData.end, toChapterData.end)

      if (scrollProgress < overlapStart) return 0
      if (scrollProgress > overlapEnd) return 1

      return (scrollProgress - overlapStart) / (overlapEnd - overlapStart)
    },
    [chapters]
  )

  useEffect(() => {
    const direction = getDirection(velocity)
    const { previous, next } = getAdjacentChapters(currentChapter)

    // Detect chapter change
    if (currentChapter !== previousChapterRef.current) {
      previousChapterRef.current = currentChapter

      // Trigger callback
      if (onChapterChange) {
        onChapterChange(currentChapter)
      }

      // Set transitioning state
      setState((prev) => ({
        ...prev,
        isTransitioning: true,
        previousChapter: previousChapterRef.current,
      }))

      // Clear existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }

      // End transition after a delay
      transitionTimeoutRef.current = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          isTransitioning: false,
        }))
      }, 300)
    }

    // Calculate transition progress if between chapters
    let transitionProgress = 0
    if (previous && direction === 'backward') {
      transitionProgress = getTransitionProgress(
        scrollProgress,
        currentChapter,
        previous
      )
    } else if (next && direction === 'forward') {
      transitionProgress = getTransitionProgress(
        scrollProgress,
        currentChapter,
        next
      )
    }

    setState((prev) => ({
      ...prev,
      currentChapter,
      previousChapter: previous,
      nextChapter: next,
      direction,
      transitionProgress,
    }))
  }, [
    scrollProgress,
    velocity,
    currentChapter,
    chapters,
    getDirection,
    getAdjacentChapters,
    getTransitionProgress,
    onChapterChange,
  ])

  // Cleanup
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  return state
}
