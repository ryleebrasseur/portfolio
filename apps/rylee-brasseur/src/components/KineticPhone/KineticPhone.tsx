import { useRef, useState, useEffect, useMemo } from 'react'
import { gsap } from 'gsap'
import siteConfig from '../../config/site-config'
import styles from './KineticPhone.module.css'

interface KineticPhoneProps {
  className?: string
}

export const KineticPhone = ({ className }: KineticPhoneProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentStage, setCurrentStage] = useState(0)
  const flipInterval = useRef<NodeJS.Timeout>()

  // Use stages from config
  const stages = useMemo(
    () =>
      siteConfig.hero.phoneStages || [
        '332.287.9533',
        '332 AT-RYLEE',
        'NYC @ RYLEE ',
      ],
    []
  )

  // Auto-flip animation
  useEffect(() => {
    flipInterval.current = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % stages.length)
    }, 3000)

    return () => {
      if (flipInterval.current) clearInterval(flipInterval.current)
    }
  }, [stages.length])

  // Flip animation
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const flippers = container.querySelectorAll(`.${styles.flipper}`)

    flippers.forEach((flipper, index) => {
      const currentChar = stages[currentStage][index]
      const prevChar =
        stages[(currentStage - 1 + stages.length) % stages.length][index]

      // Only flip if character actually changes
      if (currentChar !== prevChar) {
        const delay = index * 0.03

        gsap.to(flipper, {
          rotateX: -90,
          duration: 0.3,
          delay,
          ease: 'power2.in',
          onComplete: () => {
            // Update content mid-flip
            flipper.textContent = currentChar || ' '
            gsap.to(flipper, {
              rotateX: 0,
              duration: 0.3,
              ease: 'power2.out',
            })
          },
        })
      }
    })
  }, [currentStage, stages])

  // Clean phone number for tel: link
  const cleanedPhoneNumber = siteConfig.hero.phoneNumber.replace(/\D/g, '')

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`}
    >
      <a href={`tel:${cleanedPhoneNumber}`} className={styles.phoneLink}>
        {stages[0].split('').map((char: string, index: number) => (
          <span key={index} className={styles.flipContainer}>
            <span className={styles.flipper}>{char}</span>
          </span>
        ))}
      </a>
    </div>
  )
}
