import React, { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ControlPanel } from '../ControlPanel'
import styles from './Header.module.css'

gsap.registerPlugin(ScrollTrigger)

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  useEffect(() => {
    ScrollTrigger.create({
      trigger: document.body,
      start: '100px top',
      onEnter: () => setIsScrolled(true),
      onLeaveBack: () => setIsScrolled(false),
    })
  }, [])

  return (
    <>
      <header
        className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}
      >
        <div className={styles.headerContent}>
          <button
            className={styles.nameButton}
            onClick={() => setIsPanelOpen(true)}
            aria-label="Open customization panel"
          >
            <h1 className={styles.name}>R. Brasseur</h1>
          </button>
          <span className={styles.title}>International Relations</span>
        </div>
      </header>
      <ControlPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  )
}

export default Header
