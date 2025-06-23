import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMotion } from '../providers/MotionProvider'

gsap.registerPlugin(Flip, ScrollTrigger)

interface HeroToContactHeaderOrchestratorProps {
  // Element IDs to track for morphing
  nameHeroId?: string
  nameHeaderId?: string
  titleHeroId?: string
  titleHeaderId?: string
  emailHeroId?: string
  emailHeaderId?: string
  phoneHeroId?: string
  phoneHeaderId?: string
}

export const HeroToContactHeaderOrchestrator: React.FC<
  HeroToContactHeaderOrchestratorProps
> = ({
  nameHeroId = 'hero-name',
  nameHeaderId = 'header-name',
  titleHeroId = 'hero-title',
  titleHeaderId = 'header-title',
  emailHeroId = 'hero-email',
  emailHeaderId = 'header-email',
  phoneHeroId = 'hero-phone',
  phoneHeaderId = 'header-phone',
}) => {
  const { currentChapter, getElement } = useMotion()
  const timelineRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    // Get registered elements
    const heroName = getElement(nameHeroId)?.current
    const headerName = getElement(nameHeaderId)?.current
    const heroTitle = getElement(titleHeroId)?.current
    const headerTitle = getElement(titleHeaderId)?.current
    const heroEmail = getElement(emailHeroId)?.current
    const headerEmail = getElement(emailHeaderId)?.current
    const heroPhone = getElement(phoneHeroId)?.current
    const headerPhone = getElement(phoneHeaderId)?.current

    if (!heroName || !headerName) {
      console.warn('Required elements not found for orchestration')
      return
    }

    // Create main timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: '150% top',
        scrub: 1,
        pin: false,
        markers: false,
      },
    })

    // Phase 1: Prepare elements (0-10% of scroll)
    tl.set(
      [headerName, headerTitle, headerEmail, headerPhone].filter(Boolean),
      {
        visibility: 'hidden',
        opacity: 0,
      },
      0
    )

    // Phase 2: Start morphing (10-50% of scroll)
    if (heroName && headerName) {
      // Create curved motion path for name
      tl.to(
        heroName,
        {
          motionPath: {
            path: [
              { x: 0, y: 0 },
              { x: -100, y: -50 },
              { x: -150, y: -150 },
              { x: -100, y: -250 },
              { x: 0, y: -300 },
            ],
            curviness: 1.25,
            autoRotate: false,
          },
          scale: 0.7,
          duration: 0.4,
          ease: 'power3.inOut',
        },
        0.1
      )

      // Morph text content
      tl.to(
        heroName,
        {
          onUpdate: function () {
            const progress = this.progress()
            if (progress > 0.5 && heroName.textContent !== 'ry designs ❤️') {
              // Use FLIP for smooth text change
              const state = Flip.getState(heroName)
              heroName.textContent = 'ry designs ❤️'
              heroName.style.fontFamily = 'var(--font-display)'
              heroName.style.fontSize = '1.5rem'
              heroName.style.fontWeight = '700'
              Flip.from(state, {
                duration: 0.3,
                ease: 'power2.inOut',
                scale: true,
                onComplete: () => {
                  gsap.set(heroName, { clearProps: 'all' })
                },
              })
            }
          },
          duration: 0.4,
        },
        0.1
      )
    }

    // Title morphing with physics
    if (heroTitle && headerTitle) {
      tl.to(
        heroTitle,
        {
          y: -280,
          x: 200,
          scale: 0.6,
          duration: 0.4,
          ease: 'back.out(1.2)',
          onUpdate: function () {
            const progress = this.progress()
            if (
              progress > 0.5 &&
              heroTitle.textContent !== 'IR Student • MSU'
            ) {
              const state = Flip.getState(heroTitle)
              heroTitle.textContent = 'IR Student • MSU'
              heroTitle.style.fontSize = '0.875rem'
              heroTitle.style.opacity = '0.7'
              Flip.from(state, {
                duration: 0.2,
                ease: 'power2.inOut',
              })
            }
          },
        },
        0.15
      )
    }

    // Email with elastic motion
    if (heroEmail && headerEmail) {
      tl.to(
        heroEmail,
        {
          y: -260,
          x: 400,
          scale: 0.8,
          duration: 0.4,
          ease: 'elastic.out(1, 0.5)',
        },
        0.2
      )
    }

    // Phone slides in from side
    if (heroPhone && headerPhone) {
      tl.to(
        heroPhone,
        {
          y: -260,
          x: 600,
          scale: 0.9,
          duration: 0.4,
          ease: 'power3.out',
        },
        0.25
      )
    }

    // Phase 3: Final positioning (50-75% of scroll)
    tl.to(
      [heroName, heroTitle, heroEmail, heroPhone].filter(Boolean),
      {
        opacity: 0,
        duration: 0.2,
        stagger: 0.05,
        onComplete: () => {
          // Show header elements
          gsap.set(
            [headerName, headerTitle, headerEmail, headerPhone].filter(Boolean),
            {
              visibility: 'visible',
              opacity: 0,
            }
          )
          gsap.to(
            [headerName, headerTitle, headerEmail, headerPhone].filter(Boolean),
            {
              opacity: 1,
              duration: 0.3,
              stagger: 0.05,
              ease: 'power2.out',
            }
          )
        },
      },
      0.5
    )

    timelineRef.current = tl

    return () => {
      tl.kill()
      ScrollTrigger.getAll().forEach((st) => st.kill())
    }
  }, [
    getElement,
    nameHeroId,
    nameHeaderId,
    titleHeroId,
    titleHeaderId,
    emailHeroId,
    emailHeaderId,
    phoneHeroId,
    phoneHeaderId,
  ])

  // Handle chapter-based visibility
  useEffect(() => {
    if (currentChapter === 'hero') {
      // Ensure hero elements are visible
      const heroElements = [
        getElement(nameHeroId)?.current,
        getElement(titleHeroId)?.current,
        getElement(emailHeroId)?.current,
        getElement(phoneHeroId)?.current,
      ].filter(Boolean)

      gsap.set(heroElements, {
        visibility: 'visible',
        opacity: 1,
      })

      // Hide header elements
      const headerElements = [
        getElement(nameHeaderId)?.current,
        getElement(titleHeaderId)?.current,
        getElement(emailHeaderId)?.current,
        getElement(phoneHeaderId)?.current,
      ].filter(Boolean)

      gsap.set(headerElements, {
        visibility: 'hidden',
        opacity: 0,
      })
    } else if (currentChapter === 'sticky' || currentChapter === 'footer') {
      // Ensure header elements are visible
      const headerElements = [
        getElement(nameHeaderId)?.current,
        getElement(titleHeaderId)?.current,
        getElement(emailHeaderId)?.current,
        getElement(phoneHeaderId)?.current,
      ].filter(Boolean)

      gsap.set(headerElements, {
        visibility: 'visible',
        opacity: 1,
      })

      // Hide hero elements
      const heroElements = [
        getElement(nameHeroId)?.current,
        getElement(titleHeroId)?.current,
        getElement(emailHeroId)?.current,
        getElement(phoneHeroId)?.current,
      ].filter(Boolean)

      gsap.set(heroElements, {
        visibility: 'hidden',
        opacity: 0,
      })
    }
  }, [
    currentChapter,
    getElement,
    nameHeroId,
    nameHeaderId,
    titleHeroId,
    titleHeaderId,
    emailHeroId,
    emailHeaderId,
    phoneHeroId,
    phoneHeaderId,
  ])

  return null // This is a pure orchestrator component
}
