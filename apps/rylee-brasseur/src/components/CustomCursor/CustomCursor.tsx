import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import styles from './CustomCursor.module.css'

interface Position {
  x: number
  y: number
}

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorDotRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const position = useRef<Position>({ x: 0, y: 0 })
  const magnetTargets = useRef<NodeListOf<Element> | null>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const cursorDot = cursorDotRef.current
    if (!cursor || !cursorDot) return

    // Hide default cursor
    document.body.style.cursor = 'none'

    // Initialize magnetic targets
    magnetTargets.current = document.querySelectorAll('[data-magnetic]')

    let rafId: number

    const updateCursor = () => {
      gsap.to(cursor, {
        x: position.current.x,
        y: position.current.y,
        duration: 0.15,
        ease: 'power2.out',
      })

      gsap.to(cursorDot, {
        x: position.current.x,
        y: position.current.y,
        duration: 0.05,
      })
    }

    const onMouseMove = (e: MouseEvent) => {
      position.current = { x: e.clientX, y: e.clientY }

      // Disable magnetic effect for now - it's causing lag
      // We can re-enable with better performance later

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          updateCursor()
          rafId = 0
        })
      }
    }

    const onMouseEnter = (e: MouseEvent) => {
      const target = e.target as Element
      if (
        target &&
        target.matches &&
        target.matches('a, button, [data-hover]')
      ) {
        setIsHovering(true)
      }
    }

    const onMouseLeave = (e: MouseEvent) => {
      const target = e.target as Element
      if (
        target &&
        target.matches &&
        target.matches('a, button, [data-hover]')
      ) {
        setIsHovering(false)
      }
    }

    const onMouseDown = () => setIsClicking(true)
    const onMouseUp = () => setIsClicking(false)

    const onMouseEnterWindow = () => {
      gsap.to([cursor, cursorDot], { opacity: 1, duration: 0.3 })
    }

    const onMouseLeaveWindow = () => {
      gsap.to([cursor, cursorDot], { opacity: 0, duration: 0.3 })
    }

    // Event listeners
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseenter', onMouseEnter, true)
    document.addEventListener('mouseleave', onMouseLeave, true)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseenter', onMouseEnterWindow)
    document.addEventListener('mouseleave', onMouseLeaveWindow)

    // Initial position
    gsap.set([cursor, cursorDot], {
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
    })

    return () => {
      document.body.style.cursor = 'auto'
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseenter', onMouseEnter, true)
      document.removeEventListener('mouseleave', onMouseLeave, true)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseenter', onMouseEnterWindow)
      document.removeEventListener('mouseleave', onMouseLeaveWindow)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches
  if (prefersReducedMotion) return null

  return (
    <>
      <div
        ref={cursorRef}
        className={`${styles.cursor} ${isHovering ? styles.hovering : ''} ${isClicking ? styles.clicking : ''}`}
        aria-hidden="true"
      />
      <div ref={cursorDotRef} className={styles.cursorDot} aria-hidden="true" />
    </>
  )
}

export default CustomCursor
