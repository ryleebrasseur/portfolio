import React, { useEffect, useRef, useState } from 'react'
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
  const lastUpdateTime = useRef<number>(0)
  const rafId = useRef<number>(0)

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  // Allow users to disable custom cursor for accessibility
  const isDisabled = localStorage.getItem('disableCustomCursor') === 'true'

  useEffect(() => {
    const cursor = cursorRef.current
    const cursorDot = cursorDotRef.current
    if (!cursor || !cursorDot) return

    // Hide default cursor
    document.body.style.cursor = 'none'

    // Initialize magnetic targets
    magnetTargets.current = document.querySelectorAll('[data-magnetic]')

    const updateCursor = () => {
      // Use transform for better performance
      cursor.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0) translate(-50%, -50%)`
      cursorDot.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0) translate(-50%, -50%)`
    }

    const onMouseMove = (e: MouseEvent) => {
      position.current = { x: e.clientX, y: e.clientY }

      // Throttle updates to 60fps (16.67ms)
      const now = Date.now()
      if (now - lastUpdateTime.current < 16) {
        if (!rafId.current) {
          rafId.current = requestAnimationFrame(() => {
            updateCursor()
            rafId.current = 0
          })
        }
        return
      }

      lastUpdateTime.current = now
      updateCursor()
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
      cursor.style.opacity = '0.8'
      cursorDot.style.opacity = '0.9'
    }

    const onMouseLeaveWindow = () => {
      cursor.style.opacity = '0'
      cursorDot.style.opacity = '0'
    }

    // Event listeners
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseenter', onMouseEnter, true)
    document.addEventListener('mouseleave', onMouseLeave, true)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseenter', onMouseEnterWindow)
    document.addEventListener('mouseleave', onMouseLeaveWindow)

    // Initial setup
    cursor.style.opacity = '0'
    cursorDot.style.opacity = '0'

    return () => {
      document.body.style.cursor = 'auto'
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseenter', onMouseEnter, true)
      document.removeEventListener('mouseleave', onMouseLeave, true)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseenter', onMouseEnterWindow)
      document.removeEventListener('mouseleave', onMouseLeaveWindow)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [])

  // Ensure cursor is restored for reduced motion or disabled states
  useEffect(() => {
    if (prefersReducedMotion || isDisabled) {
      document.body.style.cursor = 'auto'
      return () => {
        document.body.style.cursor = 'auto'
      }
    }
  }, [prefersReducedMotion, isDisabled])

  // Don't render if disabled or reduced motion is preferred
  if (isDisabled || prefersReducedMotion) return null

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
