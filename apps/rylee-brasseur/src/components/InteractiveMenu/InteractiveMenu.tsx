/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ControlPanel } from '../ControlPanel'
import { prefersReducedMotion } from '../../utils/animation'
import styles from './InteractiveMenu.module.css'

gsap.registerPlugin(ScrollTrigger)

export interface MenuItem {
  id: string
  label: string
  icon?: string
  theme?: string
}

const menuItems: MenuItem[] = [
  { id: 'poster', label: 'Poster', theme: 'sunset' },
  { id: 'aaf', label: 'AAF', theme: 'cyberpunk' },
  { id: 'video', label: 'Video', theme: 'att' },
  { id: 'research', label: 'Research', theme: 'msu' },
]

interface InteractiveMenuProps {
  onItemClick: (item: MenuItem) => void
  currentSection?: string
}

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({
  onItemClick,
  currentSection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useLayoutEffect(() => {
    if (!containerRef.current || !sceneRef.current || !gridRef.current) return

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      setIsInitialized(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useLayoutEffect(() => {
    if (!isInitialized || !containerRef.current || !sceneRef.current) return

    const ctx = gsap.context(() => {
      // ============================================
      // SETUP: Define the start and end states
      // ============================================

      // Hide header initially
      gsap.set(headerRef.current, {
        opacity: 0,
        y: -30,
      })

      // Get viewport dimensions
      const vh = window.innerHeight
      const vw = window.innerWidth

      // Store original positions and sizes
      const originalStates = itemRefs.current.map((item, index) => {
        if (!item) return null
        const bounds = item.getBoundingClientRect()
        return {
          element: item,
          index,
          // Original position in grid
          origX: bounds.left,
          origY: bounds.top,
          origWidth: bounds.width,
          origHeight: bounds.height,
          // Target position in header (horizontal layout)
          targetX: 350 + index * 140, // After name/title
          targetY: 40, // Center of 80px header
          targetWidth: 120,
          targetHeight: 40,
        }
      })

      // ============================================
      // CHOREOGRAPHY: The main transformation sequence
      // ============================================

      const masterTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=1000', // Length of scroll
          scrub: 1.5, // Smooth scrubbing
          pin: true,
          pinSpacing: true,
          anticipatePin: 0, // Disable for mobile
          markers: false, // Enable for debugging
          fastScrollEnd: true, // Better mobile performance
          preventOverlaps: true,
          refreshPriority: -1, // Lower priority
          // Mobile-specific handling
          onUpdate: (self) => {
            // Force refresh on mobile if needed
            if ('ontouchstart' in window && self.progress === 0) {
              self.refresh()
            }
          },
        },
      })

      // Phase 1: Container morphs from full height to header
      masterTimeline
        .to(
          sceneRef.current,
          {
            height: '80px',
            ease: 'power2.inOut',
            duration: 1,
          },
          0
        )
        .to(
          sceneRef.current,
          {
            backgroundColor: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            ease: 'none',
            duration: 0.8,
          },
          0.2
        )

      // Phase 2: Grid transforms
      masterTimeline.to(
        gridRef.current,
        {
          gap: '2rem',
          padding: 0,
          ease: 'power2.inOut',
          duration: 0.8,
        },
        0
      )

      // Phase 3: Items travel to their destinations
      originalStates.forEach((state, index) => {
        if (!state) return

        const item = state.element
        const inner = item.querySelector(`.${styles.itemInner}`) as HTMLElement
        const label = item.querySelector(`.${styles.itemLabel}`) as HTMLElement
        const desc = item.querySelector(
          `.${styles.itemDescription}`
        ) as HTMLElement

        // Calculate the journey
        const deltaX = state.targetX - state.origX - state.origWidth / 2
        const deltaY = state.targetY - state.origY - state.origHeight / 2

        // Each item gets its own choreographed path
        const delay = index * 0.05 // Stagger the movements

        // The journey begins
        masterTimeline
          // Items start to shrink and move
          .to(
            item,
            {
              x: deltaX,
              y: deltaY,
              width: state.targetWidth,
              height: state.targetHeight,
              ease: 'power3.inOut',
              duration: 1,
            },
            delay
          )
          // Visual transformation
          .to(
            item,
            {
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              ease: 'power2.inOut',
              duration: 0.6,
            },
            delay + 0.2
          )
          // Inner content adjusts
          .to(
            inner,
            {
              padding: '0.5rem 1rem',
              ease: 'power2.inOut',
              duration: 0.6,
            },
            delay + 0.2
          )
          // Text shrinks
          .to(
            label,
            {
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              marginBottom: 0,
              ease: 'power2.inOut',
              duration: 0.8,
            },
            delay
          )
          // Description fades away
          .to(
            desc,
            {
              opacity: 0,
              height: 0,
              marginTop: 0,
              ease: 'power2.in',
              duration: 0.4,
            },
            delay
          )
      })

      // Phase 4: Header content appears
      masterTimeline.to(
        headerRef.current,
        {
          opacity: 1,
          y: 0,
          ease: 'power2.out',
          duration: 0.6,
        },
        0.7
      )

      // Phase 5: Final positioning
      masterTimeline.to(
        sceneRef.current,
        {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 'var(--z-header)',
          duration: 0,
        },
        0.9
      )

      // ============================================
      // ENTRANCE: Initial animation when page loads
      // ============================================

      gsap.from(itemRefs.current, {
        scale: 0,
        rotation: () => gsap.utils.random(-45, 45),
        opacity: 0,
        duration: 1,
        stagger: {
          each: 0.1,
          from: 'center',
          grid: [2, 2],
        },
        ease: 'back.out(1.2)',
        delay: 0.5,
        clearProps: 'rotation', // Clean up rotation after animation
      })

      // Gentle floating animation for hero state (skip if reduced motion or mobile)
      const isMobile = 'ontouchstart' in window || window.innerWidth <= 768
      if (!prefersReducedMotion() && !isMobile) {
        itemRefs.current.forEach((item, index) => {
          if (!item) return

          gsap.to(item, {
            y: gsap.utils.random(-8, 8),
            x: gsap.utils.random(-4, 4),
            duration: gsap.utils.random(4, 6),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: index * 0.3,
          })
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [isInitialized])

  const handleItemClick = (item: MenuItem, index: number) => {
    const clickedElement = itemRefs.current[index]
    if (!clickedElement) return

    // Ripple effect on click
    const tl = gsap.timeline()

    // The clicked item pulses
    tl.to(clickedElement, {
      scale: 0.95,
      duration: 0.1,
      ease: 'power2.in',
    })
      .to(clickedElement, {
        scale: 1.05,
        duration: 0.2,
        ease: 'back.out(3)',
      })
      .to(clickedElement, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.inOut',
      })

    // Other items react
    itemRefs.current.forEach((otherItem, otherIndex) => {
      if (!otherItem || otherIndex === index) return

      const distance = Math.abs(
        (otherIndex % 2) -
          (index % 2) +
          Math.abs(Math.floor(otherIndex / 2) - Math.floor(index / 2))
      )

      tl.to(
        otherItem,
        {
          scale: 0.96,
          duration: 0.15,
          delay: distance * 0.03,
          ease: 'power2.out',
        },
        0.1
      ).to(otherItem, {
        scale: 1,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)',
      })
    })

    tl.eventCallback('onComplete', () => onItemClick(item))
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <div ref={sceneRef} className={styles.scene}>
        {/* Header content - invisible until transformation */}
        <div ref={headerRef} className={styles.headerContent}>
          <button
            className={styles.nameButton}
            onClick={() => setIsPanelOpen(true)}
            aria-label="Open customization panel"
          >
            <h1 className={styles.name}>R. Brasseur</h1>
          </button>
          <span className={styles.title}>International Relations</span>
        </div>

        {/* The grid that holds our menu items */}
        <div ref={gridRef} className={styles.grid}>
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              ref={(el) => (itemRefs.current[index] = el)}
              className={`${styles.menuItem} ${
                currentSection === item.id ? styles.active : ''
              }`}
              onClick={() => handleItemClick(item, index)}
              data-hover
            >
              <div className={styles.itemInner}>
                <span className={styles.itemLabel}>{item.label}</span>
                <span className={styles.itemDescription}>
                  Explore {item.label.toLowerCase()} works
                </span>
              </div>

              {/* Animated background elements */}
              <div className={styles.bgLayer1} />
              <div className={styles.bgLayer2} />
            </div>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      <ControlPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  )
}

export default InteractiveMenu
