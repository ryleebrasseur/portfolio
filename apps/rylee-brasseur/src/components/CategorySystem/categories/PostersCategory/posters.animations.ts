import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const posterEffects = {
  // 3D tilt effect on hover
  tilt3D: (element: HTMLElement, event: MouseEvent) => {
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const percentX = (event.clientX - centerX) / (rect.width / 2)
    const percentY = (event.clientY - centerY) / (rect.height / 2)

    gsap.to(element, {
      rotationY: percentX * 15,
      rotationX: -percentY * 15,
      transformPerspective: 800,
      transformOrigin: 'center center',
      duration: 0.4,
      ease: 'power2.out',
    })
  },

  // Reset tilt
  resetTilt: (element: HTMLElement) => {
    gsap.to(element, {
      rotationY: 0,
      rotationX: 0,
      duration: 0.5,
      ease: 'power2.out',
    })
  },

  // Floating animation for selected posters
  float: (element: HTMLElement) => {
    return gsap.to(element, {
      y: -10,
      duration: 2,
      ease: 'power1.inOut',
      repeat: -1,
      yoyo: true,
    })
  },

  // Staggered reveal for poster grid
  staggerReveal: (elements: HTMLElement[]) => {
    return gsap.fromTo(
      elements,
      {
        opacity: 0,
        scale: 0.8,
        y: 80,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        stagger: {
          each: 0.1,
          from: 'random',
        },
        ease: 'power3.out',
      }
    )
  },

  // Magnetic effect for cursor interaction
  magneticPull: (element: HTMLElement, event: MouseEvent) => {
    const rect = element.getBoundingClientRect()
    const strength = 40

    const relX = event.clientX - rect.left - rect.width / 2
    const relY = event.clientY - rect.top - rect.height / 2

    const distance = Math.sqrt(relX * relX + relY * relY)
    const maxDistance = rect.width / 2

    if (distance < maxDistance) {
      const factor = 1 - distance / maxDistance
      gsap.to(element, {
        x: (relX / distance) * strength * factor,
        y: (relY / distance) * strength * factor,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  },

  // Reset magnetic pull
  resetMagnetic: (element: HTMLElement) => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.5)',
    })
  },

  // Page flip animation for detail view
  pageFlip: (element: HTMLElement) => {
    const tl = gsap.timeline()

    tl.to(element, {
      rotationY: -180,
      transformOrigin: 'left center',
      duration: 1.2,
      ease: 'power2.inOut',
    }).to(
      element,
      {
        zIndex: 10,
        duration: 0,
      },
      0.6
    )

    return tl
  },

  // Parallax scrolling for depth
  setupParallax: (elements: HTMLElement[]) => {
    elements.forEach((element, index) => {
      const speed = 0.5 + (index % 3) * 0.3

      gsap.to(element, {
        y: () => window.innerHeight * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      })
    })
  },
}
