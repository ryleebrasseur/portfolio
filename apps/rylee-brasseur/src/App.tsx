/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import {
  MotionProvider,
  HeroToContactHeaderOrchestrator,
  ContactHeader,
  KineticText,
  useMotion,
} from '@ryleebrasseur/motion-system'
import HeroSectionWebGL from './components/Hero/HeroSectionWebGL'
import CustomCursor from './components/CustomCursor/CustomCursor'
import InteractiveMenu from './components/InteractiveMenu/InteractiveMenu'
import { KineticPhone } from './components/KineticPhone/KineticPhone'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

function App() {
  const [currentSection, setCurrentSection] = useState<string>('hero')
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  const handleMenuItemClick = (item: any) => {
    // Animate transition to new section
    gsap.to(window, {
      scrollTo: { y: window.innerHeight, autoKill: false },
      duration: 1,
      ease: 'power3.inOut',
      onComplete: () => {
        setCurrentSection(item.id)
        // Apply theme
        document.documentElement.setAttribute(
          'data-theme',
          item.theme || 'sunset'
        )
      },
    })
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'poster':
        return (
          <div
            style={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h1>Poster Section - Coming Soon</h1>
          </div>
        )
      case 'aaf':
        return (
          <div
            style={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h1>AAF Section - Coming Soon</h1>
          </div>
        )
      case 'video':
        return (
          <div
            style={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h1>Video Section - Coming Soon</h1>
          </div>
        )
      case 'research':
        return (
          <div
            style={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h1>Research Section - Coming Soon</h1>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <MotionProvider>
      <CustomCursor />
      <ContactHeader onThemeClick={() => setShowThemeMenu(!showThemeMenu)} />
      <HeroToContactHeaderOrchestrator />
      <main>
        <HeroSectionWebGL />
        {/* Temporarily disabled InteractiveMenu
        <section className="menu-section">
          <InteractiveMenu 
            onItemClick={handleMenuItemClick}
            currentSection={currentSection}
          />
        </section>
        {currentSection !== 'hero' && renderSection()} */}

        {/* Spacer for scroll */}
        <div
          style={{
            height: '100vh',
            background: 'var(--color-background, #fff)',
          }}
        />
      </main>
    </MotionProvider>
  )
}

export default App
