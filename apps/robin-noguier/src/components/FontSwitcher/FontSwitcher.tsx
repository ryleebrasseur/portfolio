import { useState, useEffect } from 'react'
import styles from './FontSwitcher.module.css'

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

export const FontSwitcher = () => {
  const [currentFont, setCurrentFont] = useState('--font-serif-fashion')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load saved font preference
    const savedFont =
      localStorage.getItem('selectedFont') || '--font-serif-fashion'
    setCurrentFont(savedFont)
    updateFont(savedFont)
  }, [])

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

  const handleFontChange = (fontVariable: string) => {
    setCurrentFont(fontVariable)
    updateFont(fontVariable)
    setIsOpen(false)
  }

  const currentFontLabel =
    fontOptions.find((f) => f.variable === currentFont)?.label || 'Select Font'

  return (
    <div className={styles.fontSwitcher}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle font selector"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
        <span className={styles.currentFont}>{currentFontLabel}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Select Typography</h3>
            <button
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close font selector"
            >
              ×
            </button>
          </div>

          {['Serif', 'Sans-Serif', 'Display'].map((category) => (
            <div key={category} className={styles.category}>
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
      )}
    </div>
  )
}
