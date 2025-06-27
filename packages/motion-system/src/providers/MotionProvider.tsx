import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  RefObject,
  useCallback,
} from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionState, MotionContextType, Chapter } from '../types'

gsap.registerPlugin(ScrollTrigger)

// Global flag and instance to prevent multiple Lenis instances across ALL MotionProvider instances
let globalLenisInitialized = false
let globalLenisInstance: Lenis | null = null

const MotionContext = createContext<MotionContextType | undefined>(undefined)

// Define chapter configuration for the scroll narrative
const DEFAULT_CHAPTERS: Chapter[] = [
  { id: 'hero', start: 0, end: 0.25 },
  { id: 'morph', start: 0.25, end: 0.5 },
  { id: 'sticky', start: 0.5, end: 0.75 },
  { id: 'footer', start: 0.75, end: 1.0 },
]

interface MotionProviderProps {
  children: ReactNode
  chapters?: Chapter[]
}

export const MotionProvider: React.FC<MotionProviderProps> = ({
  children,
  chapters = DEFAULT_CHAPTERS,
}) => {
  console.log('[MotionProvider] Initializing')
  const [motionState, setMotionState] = useState<MotionState>({
    scrollProgress: 0,
    velocity: 0,
    currentChapter: 'hero',
    chapterProgress: 0,
  })

  const elementRegistry = useRef<Map<string, RefObject<HTMLElement>>>(new Map())
  const lenisRef = useRef<Lenis | null>(null)

  const registerElement = useCallback(
    (id: string, ref: RefObject<HTMLElement>) => {
      console.log('[MotionProvider] Registering element:', id)
      elementRegistry.current.set(id, ref)
    },
    []
  )

  const getElement = useCallback((id: string) => {
    return elementRegistry.current.get(id)
  }, [])

  useEffect(() => {
    if (globalLenisInitialized && globalLenisInstance) {
      console.log('[MotionProvider] Reusing existing global Lenis instance')
      lenisRef.current = globalLenisInstance
      return
    }

    globalLenisInitialized = true
    console.log('[MotionProvider] Setting up Lenis smooth scrolling')

    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    })

    lenisRef.current = lenis
    globalLenisInstance = lenis

    // Handle scroll updates
    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      const scrollProgress = e.progress
      const velocity = e.velocity

      // Find active chapter
      const activeChapter =
        chapters.find(
          (chapter) =>
            scrollProgress >= chapter.start && scrollProgress < chapter.end
        ) || chapters[chapters.length - 1]

      // Calculate progress within chapter
      const chapterDuration = activeChapter.end - activeChapter.start
      const progressInChapter =
        chapterDuration > 0
          ? (scrollProgress - activeChapter.start) / chapterDuration
          : 0

      setMotionState({
        scrollProgress,
        velocity,
        currentChapter: activeChapter.id,
        chapterProgress: Math.max(0, Math.min(1, progressInChapter)),
      })
    })

    // Modern Lenis + GSAP integration (no scrollerProxy needed)
    lenis.on('scroll', ScrollTrigger.update)

    const update = (time: number) => {
      lenis.raf(time * 1000) // Convert seconds to milliseconds
    }
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    // Handle resize
    const handleResize = () => {
      lenis.resize()
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', handleResize)
    ScrollTrigger.addEventListener('refresh', () => lenis.resize())
    ScrollTrigger.refresh()

    // Handle page visibility for performance
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lenis.stop()
      } else {
        lenis.start()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup - don't destroy global Lenis instance
    return () => {
      // Only cleanup if we created the instance
      if (lenis === globalLenisInstance) {
        console.log('[MotionProvider] Keeping global Lenis instance alive')
        // Don't destroy the global instance, just remove this component's listeners
        window.removeEventListener('resize', handleResize)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [chapters])

  useEffect(() => {
    const saveScrollPosition = () => {
      if (typeof window !== 'undefined' && window.scrollY !== null) {
        sessionStorage.setItem('scroll-position', String(window.scrollY))
      }
    }

    window.addEventListener('beforeunload', saveScrollPosition)

    // Restore scroll position
    const savedPosition = sessionStorage.getItem('scroll-position')
    if (savedPosition && lenisRef.current) {
      const position = parseFloat(savedPosition as string)
      setTimeout(() => {
        lenisRef.current?.scrollTo(position, { immediate: true })
        sessionStorage.removeItem('scroll-position')
      }, 100)
    }

    return () => {
      window.removeEventListener('beforeunload', saveScrollPosition)
    }
  }, [])

  const contextValue: MotionContextType = {
    ...motionState,
    registerElement,
    getElement,
  }

  return (
    <MotionContext.Provider value={contextValue}>
      {children}
    </MotionContext.Provider>
  )
}

// Custom hook for consuming motion context
export const useMotion = () => {
  const context = useContext(MotionContext)
  if (context === undefined) {
    throw new Error('useMotion must be used within a MotionProvider')
  }
  return context
}
