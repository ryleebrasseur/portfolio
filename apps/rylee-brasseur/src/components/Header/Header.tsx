import React, { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './Header.module.css'

gsap.registerPlugin(ScrollTrigger)

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    ScrollTrigger.create({
      trigger: document.body,
      start: '100px top',
      onEnter: () => setIsScrolled(true),
      onLeaveBack: () => setIsScrolled(false),
    })
  }, [])

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.headerContent}>
        <h1 className={styles.name}>R. Brasseur</h1>
        <span className={styles.title}>International Relations</span>
      </div>
    </header>
  )
}

export default Header
