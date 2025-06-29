import React from 'react'
import { StoryScrollerWithErrorBoundary, useStoryScroller, ScrollProvider } from '@ryleebrasseur/story-scroller'

// Create sections for narrative demo - each creates 100vh of scroll height
const createSections = () => [
  <div key="hero" className="section-content section-1">
    <h1 className="section-title">StoryScroller</h1>
    <p className="section-subtitle">Production-ready narrative scrolling for React</p>
    <p className="section-description">
      Built for complex motion narratives with GSAP ScrollTrigger integration. 
      Smooth scroll physics powered by Lenis with Observer-based navigation.
    </p>
  </div>,

  <div key="features" className="section-content section-2">
    <h1 className="section-title">Features</h1>
    <p className="section-subtitle">Everything you need for narrative motion</p>
    <p className="section-description">
      Real scroll positions for ScrollTrigger animations. Smooth Lenis physics. 
      Observer-based gesture detection. Built for complex motion choreography 
      between sections with full narrative flow support.
    </p>
  </div>,

  <div key="motion" className="section-content section-3">
    <h1 className="section-title">Motion</h1>
    <p className="section-subtitle">Designed for complex animations</p>
    <p className="section-description">
      True document flow creates scroll height for ScrollTrigger to track progress. 
      Elements can animate in/out based on scroll position. Perfect foundation 
      for narrative portfolios with seamless motion transitions.
    </p>
  </div>,

  <div key="integration" className="section-content section-4">
    <h1 className="section-title">Integration</h1>
    <p className="section-subtitle">GSAP + Lenis + React 18</p>
    <p className="section-description">
      Paranoid engineering for production stability. Handles React 18 Strict Mode, 
      Mac trackpad momentum, Next.js hydration conflicts, and memory leak prevention. 
      Built to survive in hostile production environments.
    </p>
  </div>,

  <div key="demo" className="section-content section-5">
    <h1 className="section-title">Ready</h1>
    <p className="section-subtitle">Start building narrative experiences</p>
    <p className="section-description">
      This demo shows true scroll-snapping with real document flow. 
      Each section creates actual scroll height for motion-driven narratives.
    </p>
    <a href="https://github.com/ryleebrasseur/portfolio" className="section-cta">
      View Source
    </a>
  </div>,
]

function AppContent() {
  const sections = createSections()
  
  const {
    currentSection,
    setCurrentSection,
    gotoSection,
    nextSection,
    prevSection,
    isFirstSection,
    isLastSection,
  } = useStoryScroller(sections.length)

  return (
    <>
      {/* Navigation */}
      <nav className="nav-ui">
        <button 
          className="nav-button" 
          onClick={() => {
            console.log('🔙 Prev button clicked:', {
              currentSection,
              isFirstSection,
              targetSection: currentSection - 1
            })
            prevSection()
          }} 
          disabled={isFirstSection}
        >
          ← Prev
        </button>
        <span style={{ color: 'rgba(255,255,255,0.7)', alignSelf: 'center' }}>
          {currentSection + 1} / {sections.length}
        </span>
        <button 
          className="nav-button" 
          onClick={() => {
            console.log('🔜 Next button clicked:', {
              currentSection,
              isLastSection,
              targetSection: currentSection + 1
            })
            nextSection()
          }} 
          disabled={isLastSection}
        >
          Next →
        </button>
      </nav>

      {/* StoryScroller with true scroll positions */}
      <StoryScrollerWithErrorBoundary
        sections={sections}
        onSectionChange={setCurrentSection}
        duration={1.5}
        tolerance={50}
        keyboardNavigation={true}
        errorFallback={
          <div style={{ 
            width: '100vw', 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#1a1a1a',
            color: '#ff6b6b'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1>StoryScroller Error</h1>
              <p>Something went wrong. Check the console.</p>
            </div>
          </div>
        }
      />
    </>
  )
}

function App() {
  return (
    <ScrollProvider>
      <AppContent />
    </ScrollProvider>
  )
}

export default App