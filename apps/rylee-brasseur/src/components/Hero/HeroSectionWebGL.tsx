import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { KineticPhone } from '../KineticPhone'
import { useMotion } from '@ryleebrasseur/motion-system'
import siteConfig from '../../config/site-config'
import styles from './HeroSection.module.css'

const HeroSectionWebGL = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { registerElement } = useMotion()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const institutionRef = useRef<HTMLParagraphElement>(null)
  const emailRef = useRef<HTMLAnchorElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  // Register elements with motion system after DOM is ready
  useEffect(() => {
    // Use RAF to ensure DOM is painted before registering
    const raf = requestAnimationFrame(() => {
      if (titleRef.current) registerElement('hero-name', titleRef)
      if (subtitleRef.current) registerElement('hero-title', subtitleRef)
      if (institutionRef.current)
        registerElement('hero-institution', institutionRef)
      if (emailRef.current) registerElement('hero-email', emailRef)
      if (contactRef.current) registerElement('hero-contact', contactRef)
    })

    return () => cancelAnimationFrame(raf)
  }, [registerElement])

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // Magnetic hover effect for email link
      const magneticElements =
        containerRef.current!.querySelectorAll('[data-magnetic]')

      magneticElements.forEach((el) => {
        const element = el as HTMLElement

        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2

          gsap.to(element, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.3,
            ease: 'power2.out',
          })
        }

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
          })
        }

        element.addEventListener('mousemove', handleMouseMove)
        element.addEventListener('mouseleave', handleMouseLeave)

        // Cleanup
        return () => {
          element.removeEventListener('mousemove', handleMouseMove)
          element.removeEventListener('mouseleave', handleMouseLeave)
        }
      })

      // Animate hero content on load
      gsap.from('.heroTitle', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2,
      })

      gsap.from('.heroSubtitle, .heroInstitution', {
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.4,
      })

      gsap.from('.heroContact', {
        y: 20,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.7,
      })

      // Animate scroll indicator
      gsap.to('.scrollLine', {
        scaleY: 0,
        transformOrigin: 'top',
        duration: 2,
        ease: 'power2.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className={styles.heroContainer}>
      <div className={styles.overlayContent}>
        <h1 ref={titleRef} className={`${styles.heroTitle} heroTitle`}>
          {siteConfig.hero.name}
        </h1>
        <p ref={subtitleRef} className={`${styles.heroSubtitle} heroSubtitle`}>
          {siteConfig.hero.title}
        </p>
        <p
          ref={institutionRef}
          className={`${styles.heroInstitution} heroInstitution`}
        >
          {siteConfig.hero.institution}
        </p>
        <div ref={contactRef} className={`${styles.heroContact} heroContact`}>
          <KineticPhone
            className={styles.contactPhone}
            phoneNumber={siteConfig.hero.phoneNumber}
          />
          <span className={styles.contactDivider}>|</span>
          <a
            ref={emailRef}
            href={`mailto:${siteConfig.hero.email}`}
            className={styles.contactLink}
            data-magnetic
          >
            {siteConfig.hero.email}
          </a>
        </div>
      </div>

      <div className={styles.scrollIndicator}>
        <span className={styles.scrollTextDesktop}>
          Scroll / Drag to explore
        </span>
        <span className={styles.scrollTextMobile}>Swipe to explore</span>
        <div className={`${styles.scrollLine} scrollLine`}></div>
      </div>
    </div>
  )
}

export default HeroSectionWebGL
