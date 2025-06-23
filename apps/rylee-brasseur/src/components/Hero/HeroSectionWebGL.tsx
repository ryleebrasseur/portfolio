import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { KineticPhone } from '../KineticPhone'
import styles from './HeroSection.module.css'

const HeroSectionWebGL = () => {
  const containerRef = useRef<HTMLDivElement>(null)

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
        <h1 className={`${styles.heroTitle} heroTitle`}>Rylee Brasseur</h1>
        <p className={`${styles.heroSubtitle} heroSubtitle`}>
          International Relations Student
        </p>
        <p className={`${styles.heroInstitution} heroInstitution`}>
          Michigan State University | James Madison College
        </p>
        <div className={`${styles.heroContact} heroContact`}>
          <KineticPhone className={styles.contactPhone} />
          <span className={styles.contactDivider}>|</span>
          <a
            href="mailto:hello@rysdesigns.com"
            className={styles.contactLink}
            data-magnetic
          >
            hello@rysdesigns.com
          </a>
        </div>
      </div>

      <div className={styles.scrollIndicator}>
        <span>Scroll to explore</span>
        <div className={`${styles.scrollLine} scrollLine`}></div>
      </div>
    </div>
  )
}

export default HeroSectionWebGL
