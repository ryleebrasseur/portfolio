import { useEffect, useRef, MutableRefObject } from 'react'
import Lenis from 'lenis'

export interface ScrollData {
  current: number
  target: number
  velocity: number
  progress: number
}

export const useCustomScroll = (): MutableRefObject<ScrollData> => {
  const scrollData = useRef<ScrollData>({
    current: 0,
    target: 0,
    velocity: 0,
    progress: 0,
  })

  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    lenis.on(
      'scroll',
      (e: {
        scroll: number
        targetScroll: number
        velocity: number
        direction: number
        progress: number
      }) => {
        scrollData.current.current = e.scroll
        scrollData.current.target = e.targetScroll
        scrollData.current.velocity = e.velocity
        scrollData.current.progress = e.progress
      }
    )

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return scrollData
}
