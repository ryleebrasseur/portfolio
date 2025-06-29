import React from 'react'
import { StoryScroller, useStoryScroller, ScrollProvider } from '../index'

/**
 * Test component to verify that external navigation from useStoryScroller
 * properly triggers scroll animations in the StoryScroller component
 */
export function NavigationTest() {
  const sections = [
    <div key="1" style={{ background: '#ff6b6b', color: 'white', padding: '2rem' }}>
      <h1>Section 1</h1>
      <p>Test navigation by clicking the buttons below</p>
    </div>,
    <div key="2" style={{ background: '#4ecdc4', color: 'white', padding: '2rem' }}>
      <h1>Section 2</h1>
      <p>The currentIndex should update and scroll should animate</p>
    </div>,
    <div key="3" style={{ background: '#45b7d1', color: 'white', padding: '2rem' }}>
      <h1>Section 3</h1>
      <p>Animation IDs should show correct from/to sections</p>
    </div>,
    <div key="4" style={{ background: '#96ceb4', color: 'white', padding: '2rem' }}>
      <h1>Section 4</h1>
      <p>State should remain synchronized after navigation</p>
    </div>,
  ]

  return (
    <ScrollProvider>
      <NavigationContent sections={sections} />
    </ScrollProvider>
  )
}

function NavigationContent({ sections }: { sections: React.ReactNode[] }) {
  const {
    currentSection,
    setCurrentSection,
    gotoSection,
    nextSection,
    prevSection,
    isFirstSection,
    isLastSection,
  } = useStoryScroller(sections.length)

  // Log state changes
  React.useEffect(() => {
    console.log('🧪 TEST: currentSection changed to:', currentSection)
  }, [currentSection])

  return (
    <>
      {/* Fixed navigation UI */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        padding: '1rem',
        borderRadius: '8px',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
      }}>
        <button
          onClick={() => {
            console.log('🧪 TEST: Prev button clicked')
            prevSection()
          }}
          disabled={isFirstSection}
          style={{
            padding: '0.5rem 1rem',
            cursor: isFirstSection ? 'not-allowed' : 'pointer',
            opacity: isFirstSection ? 0.5 : 1,
          }}
        >
          ← Prev
        </button>
        
        <span style={{ color: 'white' }}>
          Section {currentSection + 1} / {sections.length}
        </span>
        
        <button
          onClick={() => {
            console.log('🧪 TEST: Next button clicked')
            nextSection()
          }}
          disabled={isLastSection}
          style={{
            padding: '0.5rem 1rem',
            cursor: isLastSection ? 'not-allowed' : 'pointer',
            opacity: isLastSection ? 0.5 : 1,
          }}
        >
          Next →
        </button>
        
        {/* Direct navigation buttons */}
        <div style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem' }}>
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                console.log(`🧪 TEST: Direct navigation to section ${index}`)
                gotoSection(index)
              }}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: currentSection === index ? '#4ecdc4' : '#666',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* StoryScroller component */}
      <StoryScroller
        sections={sections}
        onSectionChange={(index) => {
          console.log('🧪 TEST: onSectionChange callback fired with index:', index)
          setCurrentSection(index)
        }}
        duration={1.2}
        tolerance={50}
        keyboardNavigation={true}
      />
    </>
  )
}