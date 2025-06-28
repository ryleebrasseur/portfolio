'use client'

import { StoryScroller, useStoryScroller } from '@ryleebrasseur/story-scroller'
import { useState } from 'react'

// Demo sections with different styles
const sections = [
  {
    id: 'hero',
    content: (
      <div className="demo-section flex flex-col items-center justify-center gap-8">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          StoryScroller
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl text-center px-8">
          A production-ready React scroll-snapping component
        </p>
        <div className="flex gap-4 mt-8">
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            Get Started
          </button>
          <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            View Docs
          </button>
        </div>
      </div>
    ),
    background: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900',
  },
  {
    id: 'features',
    content: (
      <div className="demo-section flex flex-col items-center justify-center gap-12 px-8">
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-600">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-2xl mb-3">🚀 Smooth</h3>
            <p className="text-gray-400">Buttery smooth scrolling with Lenis</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-2xl mb-3">🎯 Precise</h3>
            <p className="text-gray-400">GSAP-powered animations and control</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-2xl mb-3">⚛️ React 18+</h3>
            <p className="text-gray-400">Built for modern React with TypeScript</p>
          </div>
        </div>
      </div>
    ),
    background: 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900',
  },
  {
    id: 'demo',
    content: (
      <div className="demo-section flex flex-col items-center justify-center gap-8">
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
          Interactive Demo
        </h2>
        <div className="bg-white/5 p-8 rounded-2xl backdrop-blur-sm max-w-2xl">
          <p className="text-lg text-gray-300 mb-6">
            Try scrolling with your mouse wheel, trackpad, or keyboard arrows!
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-black/30 p-4 rounded-lg">
              <strong className="block mb-2">Mouse/Trackpad</strong>
              <p className="text-gray-400">Scroll naturally with momentum support</p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg">
              <strong className="block mb-2">Keyboard</strong>
              <p className="text-gray-400">↑↓ arrows, Page Up/Down, Home/End</p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg">
              <strong className="block mb-2">Touch</strong>
              <p className="text-gray-400">Swipe up/down on mobile devices</p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg">
              <strong className="block mb-2">Navigation</strong>
              <p className="text-gray-400">Click dots or use nav buttons</p>
            </div>
          </div>
        </div>
      </div>
    ),
    background: 'bg-gradient-to-br from-gray-900 via-green-900 to-gray-900',
  },
  {
    id: 'customization',
    content: (
      <div className="demo-section flex flex-col items-center justify-center gap-8 px-8">
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
          Customization
        </h2>
        <div className="max-w-3xl space-y-6">
          <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl mb-3">Animation Duration & Easing</h3>
            <p className="text-gray-400">Control scroll speed and feel with custom easing functions</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl mb-3">Trackpad Tolerance</h3>
            <p className="text-gray-400">Fine-tune sensitivity for different input devices</p>
          </div>
          <div className="bg-white/5 p-6 rounded-lg backdrop-blur-sm">
            <h3 className="text-xl mb-3">Callbacks & Events</h3>
            <p className="text-gray-400">Hook into section changes for custom behavior</p>
          </div>
        </div>
      </div>
    ),
    background: 'bg-gradient-to-br from-gray-900 via-orange-900 to-gray-900',
  },
  {
    id: 'contact',
    content: (
      <div className="demo-section flex flex-col items-center justify-center gap-8">
        <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
          Get Started
        </h2>
        <div className="bg-white/5 p-8 rounded-2xl backdrop-blur-sm max-w-2xl text-center">
          <p className="text-xl mb-6">Ready to add smooth scrolling to your project?</p>
          <code className="block bg-black/50 p-4 rounded-lg mb-6 font-mono">
            pnpm add @ryleebrasseur/story-scroller
          </code>
          <div className="flex gap-4 justify-center">
            <a
              href="https://github.com/ryleebrasseur/portfolio"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors inline-block"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors inline-block"
            >
              Documentation
            </a>
          </div>
        </div>
      </div>
    ),
    background: 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900',
  },
]

export default function Home() {
  const [showDebug, setShowDebug] = useState(false)
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
    <main>
      {/* Navigation UI */}
      <nav className="demo-nav">
        <button onClick={prevSection} disabled={isFirstSection}>
          ← Prev
        </button>
        <span className="text-white/70">
          {currentSection + 1} / {sections.length}
        </span>
        <button onClick={nextSection} disabled={isLastSection}>
          Next →
        </button>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="ml-4 text-xs"
        >
          {showDebug ? 'Hide' : 'Show'} Debug
        </button>
      </nav>

      {/* Dot Navigation */}
      <div className="demo-nav-dots">
        {sections.map((_, index) => (
          <button
            key={index}
            className={`demo-nav-dot ${index === currentSection ? 'active' : ''}`}
            onClick={() => gotoSection(index)}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>

      {/* Debug Info */}
      {showDebug && (
        <div className="fixed top-24 right-8 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-sm font-mono z-50">
          <div>Current Section: {currentSection}</div>
          <div>Section ID: {sections[currentSection].id}</div>
          <div>Is First: {isFirstSection.toString()}</div>
          <div>Is Last: {isLastSection.toString()}</div>
        </div>
      )}

      {/* StoryScroller Component */}
      <StoryScroller
        sections={sections.map((section, index) => (
          <div
            key={section.id}
            className={`w-full h-full ${section.background}`}
            data-testid={`section-${index}`}
          >
            {section.content}
          </div>
        ))}
        onSectionChange={setCurrentSection}
        tolerance={50} // Good for Mac trackpads
        duration={1.2}
        keyboardNavigation={true}
      />
    </main>
  )
}