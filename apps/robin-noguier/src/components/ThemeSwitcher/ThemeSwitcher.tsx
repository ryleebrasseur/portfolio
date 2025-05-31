import React, { useEffect, useState } from 'react'

const themes = [
  { name: 'default', label: 'Dark' },
  { name: 'cyberpunk', label: 'Cyberpunk' },
  { name: 'ocean', label: 'Ocean' },
  { name: 'sunset', label: 'Sunset' },
  { name: 'monochrome', label: 'Mono' },
  { name: 'forest', label: 'Forest' }
]

const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState('default')

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('portfolio-theme') || 'default'
    setCurrentTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName)
    document.documentElement.setAttribute('data-theme', themeName)
    localStorage.setItem('portfolio-theme', themeName)
  }

  return (
    <div className="theme-switcher">
      <div className="theme-options">
        {themes.map((theme) => (
          <button
            key={theme.name}
            className="theme-dot"
            data-theme={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            aria-label={`Switch to ${theme.label} theme`}
            title={theme.label}
          />
        ))}
      </div>
    </div>
  )
}

export default ThemeSwitcher