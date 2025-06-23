import React, { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'
import { useGSAP } from '@gsap/react'
import { useMotion } from '../providers/MotionProvider'

gsap.registerPlugin(Observer, useGSAP)

const sections = ['hero', 'header'] as const
type Section = typeof sections[number]

export const HeroToContactHeaderOrchestrator: React.FC = () => {
  const { getElement } = useMotion()
  const headerRef = useRef<HTMLDivElement | null>(null)
  
  const wrap = gsap.utils.wrap(0, sections.length)
  let animating = false
  let currentIndex = 0

  useGSAP(() => {
    const heroName = getElement('hero-name')?.current
    const heroTitle = getElement('hero-title')?.current
    const heroEmail = getElement('hero-email')?.current
    const heroInstitution = getElement('hero-institution')?.current
    const heroContact = getElement('hero-contact')?.current

    if (!heroName || !heroTitle || !heroEmail) {
      return
    }

    const heroElements = [heroName, heroTitle, heroEmail, heroInstitution, heroContact].filter(Boolean)

    // Create header element once
    if (!headerRef.current) {
      headerRef.current = document.createElement('div')
      headerRef.current.id = 'sticky-header-container'
      headerRef.current.innerHTML = `
        <div class="header-left">
          <h1 id="header-name">ry designs ❤️</h1>
          <span id="header-title">IR Student • MSU</span>
        </div>
        <div class="header-right">
          <a id="header-email" href="mailto:hello@rysdesigns.com">hello@rysdesigns.com</a>
          <div id="header-phone"></div>
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
        autoAlpha: 0
      })
      
      document.body.appendChild(headerRef.current)
      
      // Clone phone element
      const phoneElement = heroContact?.querySelector('.kineticPhone')
      if (phoneElement) {
        const headerPhone = headerRef.current.querySelector('#header-phone')
        if (headerPhone) {
          headerPhone.appendChild(phoneElement.cloneNode(true))
        }
      }
    }

    function gotoSection(index: number, direction: number) {
      console.log('gotoSection called:', index, 'direction:', direction, 'currentIndex:', currentIndex, 'animating:', animating)
      
      // CRITICAL: Block if animating or same section (following gist pattern exactly)
      if (animating) {
        console.log('BLOCKED: Animation in progress')
        return
      }
      
      animating = true
      index = wrap(index)

      let tl = gsap.timeline({
        defaults: { duration: 1, ease: "expo.inOut" },
        onComplete: () => {
          animating = false
          console.log('Animation complete, currentIndex now:', index)
        }
      })

      // EXACTLY like the gist: Set ALL sections to base state first
      gsap.set([heroElements, headerRef.current], { zIndex: 0, autoAlpha: 0 })
      
      if (index === 1) { // Going to header
        // Set current (hero) visible, next (header) ready to animate in
        gsap.set(heroElements, { zIndex: 1, autoAlpha: 1 })
        gsap.set(headerRef.current, { zIndex: 2, autoAlpha: 1 })
        
        tl.to(heroElements, {
          autoAlpha: 0,
          y: -20,
          stagger: 0.05
        }, 0)
        .fromTo(headerRef.current, 
          { y: -100, autoAlpha: 0 },
          { y: 0, autoAlpha: 1 }, 0.2)
      } else { // Going to hero
        // Set current (header) visible, next (hero) ready to animate in  
        gsap.set(headerRef.current, { zIndex: 1, autoAlpha: 1 })
        gsap.set(heroElements, { zIndex: 2, autoAlpha: 1 })
        
        tl.to(headerRef.current, {
          y: -100,
          autoAlpha: 0
        }, 0)
        .fromTo(heroElements,
          { y: -20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.05 }, 0.2)
      }

      currentIndex = index
    }

    Observer.create({
      type: "wheel,touch,pointer",
      preventDefault: true,
      wheelSpeed: -1,
      onUp: () => {
        console.log("Observer: scroll down detected")
        if (animating) {
          console.log("Observer: blocked - animation in progress")
          return
        }
        if (currentIndex >= sections.length - 1) {
          console.log("Observer: blocked - already at last section")
          return
        }
        gotoSection(currentIndex + 1, +1)
      },
      onDown: () => {
        console.log("Observer: scroll up detected")
        if (animating) {
          console.log("Observer: blocked - animation in progress")
          return
        }
        if (currentIndex <= 0) {
          console.log("Observer: blocked - already at first section")
          return
        }
        gotoSection(currentIndex - 1, -1)
      },
      tolerance: 10,
      debounce: true // Prevent rapid firing
    })

    // Expose for testing
    ;(window as any).testGotoSection = (section: string) => {
      const targetIndex = section === 'header' ? 1 : 0
      const direction = targetIndex > currentIndex ? 1 : -1
      gotoSection(targetIndex, direction)
    }

    return () => {
      if (headerRef.current?.parentNode) {
        headerRef.current.parentNode.removeChild(headerRef.current)
      }
    }
  }, [getElement])

  return null
}