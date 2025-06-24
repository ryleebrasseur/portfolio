import React from 'react'
import { KineticPhone } from '../../../apps/robin-noguier/src/components/KineticPhone/KineticPhone'

interface StickyHeaderProps {
  brandName: string
  tagline: string
  email: string
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({ brandName, tagline, email }) => {
  return (
    <div 
      id="sticky-header-container"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        fontFamily: 'var(--font-heading)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="header-left">
        <h1 
          id="header-name"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textTransform: 'lowercase',
            color: 'var(--text-primary)'
          }}
        >
          {brandName}
        </h1>
        <span 
          id="header-title"
          style={{
            fontFamily: 'var(--font-subtitle)',
            fontSize: 'clamp(0.875rem, 1.25vw, 1rem)',
            fontWeight: 300,
            margin: 0,
            marginTop: '0.25rem',
            letterSpacing: '0.05em',
            opacity: 0.8,
            color: 'var(--text-primary)',
            display: 'block'
          }}
        >
          {tagline}
        </span>
      </div>
      
      <div 
        className="header-right" 
        style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
      >
        <div id="header-phone">
          <KineticPhone />
        </div>
        <a 
          id="header-email"
          href={`mailto:${email}`}
          style={{
            fontFamily: 'var(--font-subtitle)',
            fontSize: 'clamp(0.875rem, 1.25vw, 1rem)',
            fontWeight: 300,
            color: 'var(--text-primary)',
            textDecoration: 'none',
            opacity: 0.8,
            transition: 'opacity 0.2s ease'
          }}
        >
          {email}
        </a>
      </div>
    </div>
  )
}