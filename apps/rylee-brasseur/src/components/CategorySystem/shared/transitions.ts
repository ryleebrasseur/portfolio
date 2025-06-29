import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const pageTransition = {
  // Fade out current view
  fadeOut: (element: HTMLElement, onComplete?: () => void) => {
    return gsap.to(element, {
      opacity: 0,
      scale: 0.95,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete,
    })
  },

  // Fade in new view
  fadeIn: (element: HTMLElement) => {
    return gsap.fromTo(
      element,
      {
        opacity: 0,
        scale: 0.95,
        y: 30,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      }
    )
  },

  // Stagger fade in for grid items
  staggerIn: (elements: HTMLElement[], stagger = 0.05) => {
    return gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 40,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger,
        ease: 'power2.out',
      }
    )
  },

  // Category switch animation
  categorySwitch: (outElement: HTMLElement, inElement: HTMLElement) => {
    const tl = gsap.timeline()

    tl.to(outElement, {
      opacity: 0,
      x: -100,
      duration: 0.5,
      ease: 'power2.in',
    })
      .set(outElement, { display: 'none' })
      .set(inElement, { display: 'block', opacity: 0, x: 100 })
      .to(inElement, {
        opacity: 1,
        x: 0,
        duration: 0.5,
        ease: 'power2.out',
      })

    return tl
  },
}

export const posterAnimations = {
  // Masonry grid breathing effect
  breathe: (element: HTMLElement) => {
    return gsap.to(element, {
      scale: 1.02,
      duration: 3,
      ease: 'power1.inOut',
      repeat: -1,
      yoyo: true,
    })
  },

  // Parallax hover effect
  parallaxHover: (element: HTMLElement, event: MouseEvent) => {
    const rect = element.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2

    gsap.to(element, {
      x: x * 0.1,
      y: y * 0.1,
      rotationY: x * 0.05,
      rotationX: -y * 0.05,
      duration: 0.5,
      ease: 'power2.out',
      transformPerspective: 1000,
    })
  },

  // Reset on mouse leave
  parallaxReset: (element: HTMLElement) => {
    gsap.to(element, {
      x: 0,
      y: 0,
      rotationY: 0,
      rotationX: 0,
      duration: 0.5,
      ease: 'power2.out',
    })
  },

  // Peel off animation for detail view
  peelOff: (element: HTMLElement, targetPosition: DOMRect) => {
    const currentPosition = element.getBoundingClientRect()

    return gsap
      .timeline()
      .set(element, {
        position: 'fixed',
        left: currentPosition.left,
        top: currentPosition.top,
        width: currentPosition.width,
        height: currentPosition.height,
        zIndex: 1000,
      })
      .to(element, {
        left: targetPosition.left,
        top: targetPosition.top,
        width: targetPosition.width,
        height: targetPosition.height,
        duration: 0.8,
        ease: 'power3.inOut',
      })
      .to(
        element,
        {
          rotationY: 180,
          duration: 0.6,
          ease: 'power2.inOut',
        },
        '-=0.4'
      )
  },
}

export const scrollAnimations = {
  // Reveal on scroll with custom threshold
  reveal: (element: HTMLElement, options = {}) => {
    const defaults = {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
    }

    return gsap.fromTo(
      element,
      { y: defaults.y, opacity: defaults.opacity },
      {
        y: 0,
        opacity: 1,
        duration: defaults.duration,
        ease: defaults.ease,
        scrollTrigger: { ...defaults.scrollTrigger, ...options },
      }
    )
  },

  // Parallax scroll effect
  parallax: (element: HTMLElement, speed = 0.5) => {
    return gsap.to(element, {
      y: () => window.innerHeight * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    })
  },
}

// Utility function to clean up animations
export const cleanupAnimations = (animations: gsap.core.Tween[]) => {
  animations.forEach((anim) => anim.kill())
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
}
