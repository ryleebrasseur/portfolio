import { useEffect, useState } from 'react'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  text: string
}

const getThemeColors = (_themeName: string): ThemeColors => {
  // Get computed styles from CSS variables
  const computedStyle = getComputedStyle(document.documentElement)

  return {
    primary: computedStyle.getPropertyValue('--bg-primary').trim(),
    secondary: computedStyle.getPropertyValue('--bg-secondary').trim(),
    accent: computedStyle.getPropertyValue('--accent').trim(),
    text: computedStyle.getPropertyValue('--text-primary').trim(),
  }
}

export const useTheme = () => {
  const [theme, setTheme] = useState<string>('sunset')
  const [colors, setColors] = useState<ThemeColors>(getThemeColors('sunset'))

  useEffect(() => {
    // Get initial theme
    const savedTheme = localStorage.getItem('portfolio-theme') || 'sunset'
    setTheme(savedTheme)
    setColors(getThemeColors(savedTheme))

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          const newTheme =
            document.documentElement.getAttribute('data-theme') || 'sunset'
          setTheme(newTheme)
          setColors(getThemeColors(newTheme))
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  return { theme, colors }
}
