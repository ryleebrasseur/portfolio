import React, { useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects, Project } from '../../data/projects'
import styles from './PinnedNav.module.css'

gsap.registerPlugin(ScrollTrigger)

interface PinnedNavProps {
  onProjectClick: (project: Project) => void
  currentProjectIndex: number
}

const themes = [
  { name: 'default', label: 'Dark' },
  { name: 'cyberpunk', label: 'Cyber' },
  { name: 'ocean', label: 'Ocean' },
  { name: 'sunset', label: 'Sunset' },
  { name: 'monochrome', label: 'Mono' },
  { name: 'forest', label: 'Forest' },
]

const PinnedNav: React.FC<PinnedNavProps> = ({
  onProjectClick,
  currentProjectIndex,
}) => {
  const [visibleTitles, setVisibleTitles] = useState<number[]>([])
  const [currentTheme, setCurrentTheme] = useState('default')

  useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('portfolio-theme') || 'default'
    setCurrentTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)

    // Set up scroll triggers for title reveals
    projects.forEach((_, index) => {
      ScrollTrigger.create({
        trigger: document.body,
        start: `${index * 100}vh top`,
        end: `${(index + 1) * 100}vh top`,
        onEnter: () => {
          setVisibleTitles((prev) => [...new Set([...prev, index])])
        },
        onLeaveBack: () => {
          if (index === 0) {
            setVisibleTitles([])
          }
        },
      })
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName)
    document.documentElement.setAttribute('data-theme', themeName)
    localStorage.setItem('portfolio-theme', themeName)
  }

  return (
    <nav className={styles.pinnedNav}>
      <div className={styles.projectButtons}>
        {projects.map((project, index) => (
          <button
            key={project.id}
            className={`${styles.projectButton} ${currentProjectIndex === index ? styles.active : ''}`}
            onClick={() => onProjectClick(project)}
            data-hover
          >
            <span className={styles.projectNumber}>0{index + 1}</span>
            <span
              className={`${styles.projectTitle} ${visibleTitles.includes(index) ? styles.visible : ''}`}
            >
              {project.title}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.themeSection}>
        <div className={styles.themeWrapper}>
          <button
            className={styles.themeToggle}
            aria-label="Theme options"
            data-hover
          >
            <span className={styles.themeIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
              </svg>
            </span>
            <span className={styles.themeLabel}>Theme</span>
          </button>
          <div className={styles.themeOptions}>
            {themes.map((theme) => (
              <button
                key={theme.name}
                className={`${styles.themeOption} ${currentTheme === theme.name ? styles.activeTheme : ''}`}
                onClick={() => handleThemeChange(theme.name)}
                aria-label={`Switch to ${theme.label} theme`}
                data-hover
              >
                <div className={styles.themePreview} data-theme={theme.name} />
                <span className={styles.themeName}>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default PinnedNav
