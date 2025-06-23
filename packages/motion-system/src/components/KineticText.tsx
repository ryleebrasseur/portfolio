import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMotion } from '../providers/MotionProvider'

interface KineticTextProps {
  id: string
  heroText: string
  headerText: string
  className?: string
  morphThreshold?: number // 0-1, when to trigger morph
  style?: React.CSSProperties
}

export const KineticText: React.FC<KineticTextProps> = ({
  id,
  heroText,
  headerText,
  className = '',
  morphThreshold = 0.5,
  style = {},
}) => {
  const elementRef = useRef<HTMLSpanElement>(null)
  const { registerElement, currentChapter, chapterProgress } = useMotion()
  const [displayText, setDisplayText] = useState(heroText)
  const [isMorphing, setIsMorphing] = useState(false)

  // Register element with motion system
  useEffect(() => {
    registerElement(id, elementRef)
  }, [id, registerElement])

  // Handle text morphing based on scroll state
  useEffect(() => {
    if (currentChapter === 'morph') {
      if (chapterProgress >= morphThreshold && displayText === heroText) {
        setIsMorphing(true)
        setTimeout(() => {
          setDisplayText(headerText)
          setIsMorphing(false)
        }, 150)
      } else if (
        chapterProgress < morphThreshold &&
        displayText === headerText
      ) {
        setIsMorphing(true)
        setTimeout(() => {
          setDisplayText(heroText)
          setIsMorphing(false)
        }, 150)
      }
    } else if (currentChapter === 'hero' && displayText !== heroText) {
      setDisplayText(heroText)
    } else if (
      (currentChapter === 'sticky' || currentChapter === 'footer') &&
      displayText !== headerText
    ) {
      setDisplayText(headerText)
    }
  }, [
    currentChapter,
    chapterProgress,
    morphThreshold,
    displayText,
    heroText,
    headerText,
  ])

  // Split text into characters for animation
  const characters = displayText.split('').map((char, index) => ({
    char,
    key: `${displayText}-${index}`,
  }))

  return (
    <span
      ref={elementRef}
      className={className}
      style={{
        display: 'inline-block',
        position: 'relative',
        ...style,
      }}
    >
      <AnimatePresence mode="wait">
        {isMorphing ? (
          <motion.span
            key="morphing"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'inline-block' }}
          >
            {displayText}
          </motion.span>
        ) : (
          <motion.span
            key={displayText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'inline-block' }}
          >
            {characters.map(({ char, key }, index) => (
              <motion.span
                key={key}
                initial={{
                  y: isMorphing ? 10 : 0,
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.01,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  display: 'inline-block',
                  whiteSpace: char === ' ' ? 'pre' : 'normal',
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
