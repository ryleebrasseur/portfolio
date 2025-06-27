import React, { useRef } from 'react'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import { useGSAP } from '@gsap/react'
import { useMotion } from '../providers/MotionProvider'

import { SiteConfig } from '@ryleebrasseur/shared-types'

interface HeroToContactHeaderOrchestratorProps {
  siteConfig: SiteConfig
}

gsap.registerPlugin(Observer, useGSAP)

export const HeroToContactHeaderOrchestrator: React.FC<
  HeroToContactHeaderOrchestratorProps
> = ({ siteConfig }) => {
  const sections = siteConfig.motionSystem.sections
  const { getElement } = useMotion()
  const headerRef = useRef<HTMLDivElement | null>(null)
  const currentIndexRef = useRef(0)
  const animatingRef = useRef(false)

  const wrap = gsap.utils.wrap(0, sections.length)

  useGSAP(() => {
    console.log('[HeroToContactHeader] Initializing orchestrator')
    console.log(
      '[HeroToContactHeader] Initial scroll position:',
      window.scrollY
    )
    console.log('[HeroToContactHeader] Current index:', currentIndexRef.current)
    console.log(
      '[HeroToContactHeader] React.StrictMode:',
      'root' in React ? 'enabled' : 'disabled'
    )

    // Clean up any existing header from previous StrictMode render
    const existingHeader = document.getElementById('sticky-header-container')
    if (existingHeader) {
      console.log(
        '[HeroToContactHeader] Removing existing header from previous render'
      )
      existingHeader.remove()
    }

    // Force scroll reset using GSAP to bypass Observer
    gsap.set(window, { scrollTo: 0 })
    console.log('[HeroToContactHeader] Scroll reset to:', window.scrollY)

    const heroName = getElement('hero-name')?.current
    const heroTitle = getElement('hero-title')?.current
    const heroEmail = getElement('hero-email')?.current
    const heroInstitution = getElement('hero-institution')?.current
    const heroContact = getElement('hero-contact')?.current

    if (!heroName || !heroTitle || !heroEmail) {
      // This is expected on first render before elements register
      console.log('[HeroToContactHeader] Waiting for elements to register:', {
        heroName: !!heroName,
        heroTitle: !!heroTitle,
        heroEmail: !!heroEmail,
      })
      return
    }

    const heroElements = [
      heroName,
      heroTitle,
      heroEmail,
      heroInstitution,
      heroContact,
    ].filter(Boolean)

    // Create header element once - IDEMPOTENT CHECK
    if (
      !headerRef.current &&
      !document.getElementById('sticky-header-container')
    ) {
      console.log('[HeroToContactHeader] Creating header element')
      headerRef.current = document.createElement('div')
      headerRef.current.id = 'sticky-header-container'
      headerRef.current.innerHTML = `
        <div class="header-left">
          <h1 id="header-name">${siteConfig.header.brandName}</h1>
          <span id="header-title">${siteConfig.header.tagline}</span>
        </div>
        <div class="header-right" style="display: flex; align-items: center; gap: 1rem;">
          <div id="header-phone"></div>
          <a id="header-email" href="mailto:${siteConfig.header.email}">${siteConfig.header.email}</a>
        </div>
      `

      // Set initial states following gist pattern
      gsap.set(heroElements, { zIndex: 1, autoAlpha: 1 })
      gsap.set(headerRef.current, {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        autoAlpha: 0,
      })

      // Style the header elements with proper typography
      const headerName = headerRef.current.querySelector(
        '#header-name'
      ) as HTMLElement
      const headerTitle = headerRef.current.querySelector(
        '#header-title'
      ) as HTMLElement
      const headerEmail = headerRef.current.querySelector(
        '#header-email'
      ) as HTMLElement

      if (headerName) {
        gsap.set(headerName, {
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          textTransform: 'lowercase',
          color: 'var(--text-primary)',
        })
      }

      if (headerTitle) {
        gsap.set(headerTitle, {
          fontFamily: 'var(--font-subtitle)',
          fontSize: 'clamp(0.875rem, 1.25vw, 1rem)',
          fontWeight: 300,
          margin: 0,
          marginTop: '0.25rem',
          letterSpacing: '0.05em',
          opacity: 0.8,
          color: 'var(--text-primary)',
        })
      }

      if (headerEmail) {
        gsap.set(headerEmail, {
          fontFamily: 'var(--font-subtitle)',
          fontSize: 'clamp(0.875rem, 1.25vw, 1rem)',
          fontWeight: 300,
          color: 'var(--text-primary)',
          textDecoration: 'none',
          opacity: 0.8,
          transition: 'opacity 0.2s ease',
        })
      }

      // Only append if not already in DOM
      if (!document.getElementById('sticky-header-container')) {
        console.log('[HeroToContactHeader] Appending header to DOM')
        document.body.appendChild(headerRef.current)
      } else {
        console.log(
          '[HeroToContactHeader] Header already in DOM, skipping append'
        )
      }

      // CREATE ACTUAL KINETIC PHONE STRUCTURE - not just text
      const headerPhone = headerRef.current.querySelector('#header-phone')
      if (headerPhone) {
        // Create container with proper classes
        const container = document.createElement('div')
        container.className = 'container' // Match KineticPhone CSS
        container.style.cssText = `
          position: relative;
          display: inline-block;
          margin-right: 1rem;
        `

        // Create phone link
        const phoneLink = document.createElement('a')
        phoneLink.href = 'tel:3322879533'
        phoneLink.className = 'phoneLink' // Match KineticPhone CSS
        phoneLink.style.cssText = `
          display: inline-flex;
          align-items: center;
          text-decoration: none;
          color: var(--text-primary);
          font-family: var(--font-subtitle);
          font-size: clamp(0.875rem, 1.25vw, 1rem);
          font-weight: 400;
          letter-spacing: 0;
          opacity: 0.8;
          transition: opacity 0.3s ease;
        `

        const stages = ['332 287-9533', '332 AT-RYLEE', 'NYC @ RYLEE ']
        let currentStage = 0

        // CREATE FLIP CONTAINERS AND FLIPPERS
        const createFlipStructure = (text: string) => {
          phoneLink.innerHTML = ''
          text.split('').forEach((char, _index) => {
            // Create flip container
            const flipContainer = document.createElement('span')
            flipContainer.className = 'flipContainer' // CRITICAL: This class must exist for test
            flipContainer.style.cssText = `
              display: inline-block;
              position: relative;
              height: 1.2em;
              overflow: hidden;
              transform-style: preserve-3d;
              perspective: 300px;
            `

            // Create flipper
            const flipper = document.createElement('span')
            flipper.className = 'flipper' // CRITICAL: This class must exist for test
            flipper.style.cssText = `
              display: inline-flex;
              align-items: center;
              justify-content: center;
              height: 100%;
              min-width: 0.5ch;
              transform-origin: center center;
              transform-style: preserve-3d;
              font-variant-numeric: tabular-nums;
            `
            flipper.textContent = char

            flipContainer.appendChild(flipper)
            phoneLink.appendChild(flipContainer)
          })
        }

        // Initial structure
        createFlipStructure(stages[0])

        // Animation function with actual FLIP effect
        const animateFlip = () => {
          const prevStage = currentStage
          currentStage = (currentStage + 1) % stages.length
          const prevText = stages[prevStage]
          const newText = stages[currentStage]
          const flippers = phoneLink.querySelectorAll('.flipper')

          newText.split('').forEach((char, index) => {
            if (flippers[index]) {
              const flipper = flippers[index] as HTMLElement
              const prevChar = prevText[index]

              // Only flip if character actually changes
              if (char !== prevChar) {
                const delay = index * 0.03

                // GSAP 3D flip animation using rotateX (not rotationX)
                gsap.to(flipper, {
                  rotateX: -90,
                  duration: 0.3,
                  delay,
                  ease: 'power2.in',
                  onComplete: () => {
                    flipper.textContent = char
                    gsap.to(flipper, {
                      rotateX: 0,
                      duration: 0.3,
                      ease: 'power2.out',
                    })
                  },
                })
              }
            }
          })
        }

        // Start animation loop
        console.log('[HeroToContactHeader] Starting kinetic phone animation')
        setInterval(animateFlip, 3000)

        container.appendChild(phoneLink)
        headerPhone.appendChild(container)
      }
    }

    function gotoSection(index: number, direction: number) {
      console.log('[HeroToContactHeader] gotoSection called:', {
        targetIndex: index,
        direction: direction > 0 ? 'down' : 'up',
        currentIndex: currentIndexRef.current,
        animating: animatingRef.current,
        timestamp: new Date().toISOString(),
      })

      // CRITICAL: Block if animating or same section (following gist pattern exactly)
      if (animatingRef.current) {
        console.warn(
          '[HeroToContactHeader] BLOCKED: Animation already in progress'
        )
        return
      }

      animatingRef.current = true
      index = wrap(index)

      const tl = gsap.timeline({
        defaults: {
          duration: siteConfig.motionSystem.animationDuration / 1000,
          ease: siteConfig.motionSystem.easing,
        },
        onComplete: () => {
          animatingRef.current = false
          console.log('[HeroToContactHeader] Animation complete:', {
            newIndex: index,
            section: index === 0 ? 'hero' : 'header',
            timestamp: new Date().toISOString(),
          })
        },
      })

      // EXACTLY like the gist: Set ALL sections to base state first
      gsap.set([heroElements, headerRef.current], { zIndex: 0, autoAlpha: 0 })

      if (index === 1) {
        // Going to header
        console.log('[HeroToContactHeader] Transitioning: hero -> header')
        // Set current (hero) visible, next (header) ready to animate in
        gsap.set(heroElements, { zIndex: 1, autoAlpha: 1 })
        gsap.set(headerRef.current, { zIndex: 2, autoAlpha: 1 })

        tl.to(
          heroElements,
          {
            autoAlpha: 0,
            y: -20,
            stagger: siteConfig.motionSystem.staggerDelay,
          },
          0
        ).fromTo(
          headerRef.current,
          { y: -100, autoAlpha: 0 },
          { y: 0, autoAlpha: 1 },
          0.2
        )
      } else {
        // Going to hero
        console.log('[HeroToContactHeader] Transitioning: header -> hero')
        // Set current (header) visible, next (hero) ready to animate in
        gsap.set(headerRef.current, { zIndex: 1, autoAlpha: 1 })
        gsap.set(heroElements, { zIndex: 2, autoAlpha: 1 })

        // Animate scroll to top as part of the transition
        console.log('[HeroToContactHeader] Animating scroll to top')
        tl.to(
          window,
          {
            scrollTo: 0,
            duration: siteConfig.motionSystem.animationDuration / 1000,
            ease: siteConfig.motionSystem.easing,
          },
          0
        )
          .to(
            headerRef.current,
            {
              y: -100,
              autoAlpha: 0,
            },
            0
          )
          .fromTo(
            heroElements,
            { y: -20, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              stagger: siteConfig.motionSystem.staggerDelay,
            },
            0.2
          )
      }

      currentIndexRef.current = index
    }

    // Store observer instance for cleanup
    let observer: any = null

    // Delay Observer creation to allow browser scroll restoration to complete
    const observerTimeout = setTimeout(() => {
      console.log('[HeroToContactHeader] Creating Observer after delay')
      console.log(
        '[HeroToContactHeader] Pre-Observer scroll position:',
        window.scrollY
      )

      // Force scroll to top AGAIN before creating Observer
      window.scrollTo(0, 0)
      console.log(
        '[HeroToContactHeader] Force reset scroll to:',
        window.scrollY
      )

      observer = Observer.create({
        type: 'wheel,touch,pointer',
        preventDefault: true,
        wheelSpeed: -1,
        onUp: () => {
          console.log('[Observer] Scroll DOWN detected:', {
            scrollY: window.scrollY,
            currentIndex: currentIndexRef.current,
            animating: animatingRef.current,
            timestamp: new Date().toISOString(),
          })
          if (animatingRef.current) {
            console.warn('[Observer] BLOCKED: Animation in progress')
            return
          }
          if (currentIndexRef.current >= sections.length - 1) {
            console.warn('[Observer] BLOCKED: Already at last section')
            return
          }
          gotoSection(currentIndexRef.current + 1, +1)
        },
        onDown: () => {
          console.log('[Observer] Scroll UP detected:', {
            scrollY: window.scrollY,
            currentIndex: currentIndexRef.current,
            animating: animatingRef.current,
            timestamp: new Date().toISOString(),
          })
          if (animatingRef.current) {
            console.warn('[Observer] BLOCKED: Animation in progress')
            return
          }
          if (currentIndexRef.current <= 0) {
            console.warn('[Observer] BLOCKED: Already at first section')
            return
          }
          gotoSection(currentIndexRef.current - 1, -1)
        },
        tolerance: 10,
        debounce: true, // Prevent rapid firing
      })
      console.log('[HeroToContactHeader] Observer created successfully')
    }, 100) // 100ms delay to let browser restore scroll

    // Expose for testing
    ;(window as any).testGotoSection = (section: string) => {
      const targetIndex = section === 'header' ? 1 : 0
      const direction = targetIndex > currentIndexRef.current ? 1 : -1
      gotoSection(targetIndex, direction)
    }

    return () => {
      console.log('[HeroToContactHeader] Cleaning up orchestrator')

      // Clear timeout if still pending
      clearTimeout(observerTimeout)

      // Kill observer
      if (observer) {
        console.log('[HeroToContactHeader] Killing Observer')
        observer.kill()
      }

      if (headerRef.current?.parentNode) {
        console.log('[HeroToContactHeader] Removing header from DOM')
        headerRef.current.parentNode.removeChild(headerRef.current)
      }
    }
  }, [getElement])

  return null
}
