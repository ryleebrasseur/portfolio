import React from 'react'
import styles from './GradientImage.module.css'

interface GradientImageProps {
  gradient: string
  className?: string
}

const gradients: Record<string, string> = {
  'gradient-1': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'gradient-2': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'gradient-3': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'gradient-4': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'gradient-5': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'gradient-6': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'gradient-7': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'gradient-8': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'gradient-9': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'gradient-10': 'linear-gradient(135deg, #ff6a88 0%, #ff99ac 100%)',
}

const GradientImage: React.FC<GradientImageProps> = ({
  gradient,
  className = '',
}) => {
  const gradientStyle = gradients[gradient] || gradients['gradient-1']

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
