import React, { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { createPortal } from 'react-dom'
import styles from './CategoryLauncher.module.css'

export interface CategoryData {
  id: string
  name: string
  count: number
  color: string
  description: string
}

interface CategoryLauncherProps {
  category: CategoryData
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
  originElement?: HTMLElement | null
}

const CategoryLauncher: React.FC<CategoryLauncherProps> = ({
  category,
  isOpen,
  onClose,
  children,
  originElement,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (isOpen && !isAnimating && originElement) {
      // Show the component
      setIsVisible(true)
      setIsAnimating(true)

      // Get the bounds of the origin element
      const bounds = originElement.getBoundingClientRect()

      // Create the animation timeline
      const tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => {
          setIsAnimating(false)
        },
      })

      // Set initial state
      gsap.set(overlayRef.current, {
        position: 'fixed',
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        opacity: 1,
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${category.color}22, ${category.color}44)`,
        zIndex: 'var(--z-modal)',
      })

      gsap.set(contentRef.current, {
        opacity: 0,
        scale: 0.9,
      })

      gsap.set(backdropRef.current, {
        opacity: 0,
      })

      // Animate to full screen
      tl.to(
        backdropRef.current,
        {
          opacity: 1,
          duration: 0.4,
        },
        0
      )
        .to(
          overlayRef.current,
          {
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            borderRadius: 0,
            duration: 0.8,
            ease: 'power3.inOut',
          },
          0
        )
        .to(
          overlayRef.current,
          {
            background: `linear-gradient(135deg, ${category.color}11, ${category.color}22)`,
            duration: 0.6,
          },
          0.2
        )
        .to(
          contentRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            delay: 0.3,
          },
          0.4
        )

      timelineRef.current = tl
    } else if (!isOpen && isVisible && !isAnimating && originElement) {
      // Animate close
      setIsAnimating(true)

      const bounds = originElement.getBoundingClientRect()

      const tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => {
          setIsAnimating(false)
          setIsVisible(false)
        },
      })

      tl.to(contentRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
      })
        .to(
          backdropRef.current,
          {
            opacity: 0,
            duration: 0.4,
          },
          0.2
        )
        .to(
          overlayRef.current,
          {
            top: bounds.top,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${category.color}22, ${category.color}44)`,
            duration: 0.6,
          },
          0.1
        )
        .to(
          overlayRef.current,
          {
            opacity: 0,
            duration: 0.2,
          },
          0.6
        )

      timelineRef.current = tl
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill()
      }
    }
  }, [isOpen, category, originElement, isAnimating, isVisible])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isAnimating) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose, isAnimating])

  if (!isVisible) return null

  return createPortal(
    <div className={styles.container}>
      <div
        ref={backdropRef}
        className={styles.backdrop}
        onClick={!isAnimating ? onClose : undefined}
      />
      <div ref={overlayRef} className={styles.overlay}>
        <div ref={contentRef} className={styles.content}>
          <header className={styles.header}>
            <button
              className={styles.closeButton}
              onClick={onClose}
              disabled={isAnimating}
              aria-label="Close category view"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className={styles.categoryTitle}>{category.name}</h1>
            <p className={styles.categoryDescription}>{category.description}</p>
            <div className={styles.categoryMeta}>
              <span>{category.count} Projects</span>
            </div>
          </header>
          <div className={styles.categoryContent}>
            {children || (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="9" x2="15" y2="9" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <h2>Coming Soon</h2>
                <p>This category view is under development</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CategoryLauncher
