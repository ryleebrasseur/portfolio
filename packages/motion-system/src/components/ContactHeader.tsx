import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMotion } from '../providers/MotionProvider'

interface ContactHeaderProps {
  className?: string
  onThemeClick?: () => void
}

export const ContactHeader: React.FC<ContactHeaderProps> = ({
  className = '',
  onThemeClick,
}) => {
  const headerRef = useRef<HTMLElement>(null)
  const { currentChapter, scrollProgress } = useMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('hello@rydesigns.love')

  // Dynamic email based on scroll progress
  useEffect(() => {
    const emails = [
      { threshold: 0, email: 'hello@rydesigns.love' },
      { threshold: 0.25, email: 'curious@rydesigns.love' },
      { threshold: 0.5, email: 'interested@rydesigns.love' },
      { threshold: 0.75, email: 'letschat@rydesigns.love' },
      { threshold: 0.9, email: 'hireme@rydesigns.love' },
    ]

    const currentEmail =
      emails.reverse().find((e) => scrollProgress >= e.threshold)?.email ||
      emails[0].email

    if (currentEmail !== email) {
      setEmail(currentEmail)
    }
  }, [scrollProgress, email])

  // Visibility based on chapter
  useEffect(() => {
    const shouldBeVisible =
      currentChapter === 'sticky' || currentChapter === 'footer'
    setIsVisible(shouldBeVisible)
  }, [currentChapter])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          ref={headerRef}
          className={`contact-header ${className}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--color-background, #fff)',
            borderBottom: '1px solid var(--color-border, #eee)',
            padding: '1rem 2rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '1200px',
              margin: '0 auto',
            }}
          >
            {/* Name with theme trigger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <motion.button
                onClick={onThemeClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <span
                  id="header-name"
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  <span style={{ textDecoration: 'underline' }}>r</span>y
                  designs ❤️
                </span>
              </motion.button>

              <span
                id="header-title"
                style={{
                  fontSize: '0.875rem',
                  opacity: 0.7,
                  fontFamily: 'var(--font-body)',
                }}
              >
                IR Student • MSU
              </span>
            </div>

            {/* Contact info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <motion.a
                id="header-email"
                href={`mailto:${email}`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={email}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {email}
                  </motion.span>
                </AnimatePresence>
              </motion.a>

              <motion.a
                id="header-phone"
                href="tel:+15176457698"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                (517) 645-7698
              </motion.a>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  )
}
