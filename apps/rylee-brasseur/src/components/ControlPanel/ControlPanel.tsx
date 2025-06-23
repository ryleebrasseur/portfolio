import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { themes } from '../../config/themes'
import styles from './ControlPanel.module.css'

interface FontOption {
  label: string
  variable: string
  category: string
  subtitlePair?: string
}

const fontOptions: FontOption[] = [
  // Serif Fonts - Classic/Editorial
  {
    label: 'Playfair Display',
    variable: '--font-serif-fashion',
    category: 'Serif',
    subtitlePair: '--font-sans-modern',
  },
  {
    label: 'Bodoni Moda',
    variable: '--font-serif-editorial',
    category: 'Serif',
    subtitlePair: '--font-sans-clean',
  },
  {
    label: 'Lora',
    variable: '--font-serif-modern',
    category: 'Serif',
    subtitlePair: '--font-system',
  },

  // Sans-Serif - Modern/Clean
  {
    label: 'System Default',
    variable: '--font-system',
    category: 'Sans-Serif',
    subtitlePair: '--font-serif-modern',
  },
  {
    label: 'Helvetica Neue',
    variable: '--font-sans-clean',
    category: 'Sans-Serif',
    subtitlePair: '--font-serif-modern',
  },
  {
    label: 'Montserrat',
    variable: '--font-sans-modern',
    category: 'Sans-Serif',
    subtitlePair: '--font-sans-modern',
  },
  {
    label: 'Oswald',
    variable: '--font-sans-strong',
    category: 'Sans-Serif',
    subtitlePair: '--font-serif-modern',
  },

  // Display Fonts - Bold/Unique
  {
    label: 'Bebas Neue',
    variable: '--font-display-bold',
    category: 'Display',
    subtitlePair: '--font-system',
  },
  {
    label: 'Russo One',
    variable: '--font-display-tech',
    category: 'Display',
    subtitlePair: '--font-sans-clean',
  },
  {
    label: 'Archivo Black',
    variable: '--font-display-impact',
    category: 'Display',
    subtitlePair: '--font-serif-fashion',
  },
]

interface ControlPanelProps {
  isOpen: boolean
  onClose: () => void
}

export const ControlPanel = ({ isOpen, onClose }: ControlPanelProps) => {
  const [currentTheme, setCurrentTheme] = useState('sunset')
  const [currentFont, setCurrentFont] = useState('--font-serif-fashion')
  const panelRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('selectedTheme') || 'sunset'
    const savedFont =
      localStorage.getItem('selectedFont') || '--font-serif-fashion'
    setCurrentTheme(savedTheme)
    setCurrentFont(savedFont)
    updateFont(savedFont)
  }, [])

  useEffect(() => {
    const panel = panelRef.current
    const backdrop = backdropRef.current

    if (!panel || !backdrop) return

    if (isOpen) {
      // Show backdrop
      gsap.set(backdrop, { display: 'block' })
      gsap.to(backdrop, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out',
      })

      // Slide in panel
      gsap.set(panel, { display: 'flex', xPercent: -100 })
      gsap.to(panel, {
        xPercent: 0,
        duration: 0.5,
        ease: 'power3.out',
      })
    } else {
      // Slide out panel
      gsap.to(panel, {
        xPercent: -100,
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => gsap.set(panel, { display: 'none' }),
      })

      // Hide backdrop
      gsap.to(backdrop, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => gsap.set(backdrop, { display: 'none' }),
      })
    }
  }, [isOpen])

  const updateFont = (fontVariable: string) => {
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    const fontValue = computedStyle.getPropertyValue(fontVariable).trim()

    if (fontValue) {
      root.style.setProperty('--font-heading', `var(${fontVariable})`)

      // Set the paired subtitle font
      const fontOption = fontOptions.find((f) => f.variable === fontVariable)
      if (fontOption?.subtitlePair) {
        root.style.setProperty(
          '--font-subtitle',
          `var(${fontOption.subtitlePair})`
        )
      }

      localStorage.setItem('selectedFont', fontVariable)
    }
  }

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('selectedTheme', theme)
  }

  const handleFontChange = (fontVariable: string) => {
    setCurrentFont(fontVariable)
    updateFont(fontVariable)
  }

  const currentFontLabel =
    fontOptions.find((f) => f.variable === currentFont)?.label || 'Select Font'

  return (
    <>
      <div
        ref={backdropRef}
        className={styles.backdrop}
        onClick={onClose}
        style={{ display: 'none', opacity: 0 }}
      />

      <div ref={panelRef} className={styles.panel} style={{ display: 'none' }}>
        <div className={styles.header}>
          <h2>Customize</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Theme</h3>
          <div className={styles.themeGrid}>
            {themes.map((theme) => (
              <button
                key={theme.id}
                className={`${styles.themeOption} ${currentTheme === theme.id ? styles.active : ''}`}
                onClick={() => handleThemeChange(theme.id)}
                aria-label={`Switch to ${theme.label} theme`}
              >
                <div
                  className={styles.themePreview}
                  style={{
                    background: `linear-gradient(135deg, ${theme.preview[0]} 0%, ${theme.preview[1]} 100%)`,
                  }}
                />
                <span className={styles.themeName}>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Typography</h3>
          <div className={styles.currentFont}>
            Current: <span>{currentFontLabel}</span>
          </div>

          {['Serif', 'Sans-Serif', 'Display'].map((category) => (
            <div key={category} className={styles.fontCategory}>
              <h4 className={styles.categoryTitle}>{category}</h4>
              <div className={styles.fontList}>
                {fontOptions
                  .filter((font) => font.category === category)
                  .map((font) => (
                    <button
                      key={font.variable}
                      className={`${styles.fontOption} ${currentFont === font.variable ? styles.active : ''}`}
                      onClick={() => handleFontChange(font.variable)}
                      style={{ fontFamily: `var(${font.variable})` }}
                    >
                      {font.label}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
