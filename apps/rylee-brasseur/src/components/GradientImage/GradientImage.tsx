import React, { useMemo } from 'react'
import { useTheme } from '../../hooks/useTheme'
import styles from './GradientImage.module.css'

interface GradientImageProps {
  gradient: string
  className?: string
}

const GradientImage: React.FC<GradientImageProps> = ({
  gradient,
  className = '',
}) => {
  const { theme, colors } = useTheme()

  const gradientStyle = useMemo(() => {
    // Create theme-aware gradients based on the current theme
    const baseGradients: Record<string, Record<string, string>> = {
      sunset: {
        'gradient-1': `linear-gradient(135deg, ${colors.accent} 0%, ${colors.text} 100%)`,
        'gradient-2': `linear-gradient(135deg, #ff8c94 0%, #ffd166 100%)`,
        'gradient-3': `linear-gradient(135deg, #2d1b69 0%, #ff8c94 100%)`,
        'gradient-4': `linear-gradient(135deg, #ffd166 0%, #ff8c94 100%)`,
        'gradient-5': `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.accent} 100%)`,
      },
      cyberpunk: {
        'gradient-1': `linear-gradient(135deg, ${colors.accent} 0%, ${colors.text} 100%)`,
        'gradient-2': `linear-gradient(135deg, #00ffaa 0%, #ff0080 100%)`,
        'gradient-3': `linear-gradient(135deg, #141428 0%, #00ffaa 100%)`,
        'gradient-4': `linear-gradient(135deg, #ff0080 0%, #00ffaa 100%)`,
        'gradient-5': `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.accent} 100%)`,
      },
      att: {
        'gradient-1': `linear-gradient(135deg, ${colors.accent} 0%, ${colors.secondary} 100%)`,
        'gradient-2': `linear-gradient(135deg, #00a8e0 0%, #0080c0 100%)`,
        'gradient-3': `linear-gradient(135deg, #000000 0%, #00a8e0 100%)`,
        'gradient-4': `linear-gradient(135deg, #0080c0 0%, #004080 100%)`,
        'gradient-5': `linear-gradient(135deg, ${colors.accent} 0%, ${colors.primary} 100%)`,
      },
      msu: {
        'gradient-1': `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
        'gradient-2': `linear-gradient(135deg, #18453b 0%, #ffffff 100%)`,
        'gradient-3': `linear-gradient(135deg, #0d221c 0%, #18453b 100%)`,
        'gradient-4': `linear-gradient(135deg, #ffffff 0%, #18453b 100%)`,
        'gradient-5': `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.accent} 100%)`,
      },
    }

    const themeGradients = baseGradients[theme] || baseGradients.sunset
    const gradientIndex = gradient.replace('gradient-', '')
    const fallbackIndex = ((parseInt(gradientIndex) - 1) % 5) + 1

    return (
      themeGradients[gradient] ||
      themeGradients[`gradient-${fallbackIndex}`] ||
      themeGradients['gradient-1']
    )
  }, [theme, colors, gradient])

  return (
    <div
      className={`${styles.gradientImage} ${className}`}
      style={{ background: gradientStyle }}
    >
      <div className={styles.noise}></div>
    </div>
  )
}

export default GradientImage
