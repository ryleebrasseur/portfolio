import React, { useState, useCallback } from 'react';
import { 
  StoryScrollerWithErrorBoundary, 
  ScrollProvider, 
  useScrollContext, 
  useScrollActions,
  useStoryScroller,
  type StoryScrollerConfig 
} from '@ryleebrasseur/story-scroller';

// Rich content sections that showcase the package capabilities
const createSections = () => [
  <section key="hero" className="section-content section-1">
    <h1 className="section-title">StoryScroller</h1>
    <p className="section-subtitle">Production-ready narrative scrolling for React</p>
    <p className="section-description">
      Seamlessly blend storytelling with smooth scrolling animations. 
      Built with GSAP, Lenis, and React 18 for maximum performance.
    </p>
    <a href="#features" className="section-cta">Explore Features</a>
  </section>,

  <section key="features" className="section-content section-2">
    <h1 className="section-title">Features</h1>
    <p className="section-subtitle">Everything you need for narrative motion</p>
    <div className="section-description">
      <ul className="feature-list">
        <li>🎯 Magnetic snap scrolling with physics-based easing</li>
        <li>⚡ Optimized performance with debounced state management</li>
        <li>🎛️ Comprehensive configuration options</li>
        <li>🛡️ Built-in error boundaries and recovery</li>
        <li>📱 Touch and keyboard navigation support</li>
        <li>🎨 Completely customizable styling</li>
      </ul>
    </div>
  </section>,

  <section key="motion" className="section-content section-3">
    <h1 className="section-title">Motion</h1>
    <p className="section-subtitle">Designed for complex animations</p>
    <p className="section-description">
      Leverage GSAP's powerful animation engine with Lenis smooth scrolling. 
      Perfect for creating immersive storytelling experiences with precise control 
      over timing, easing, and section transitions.
    </p>
    <div className="motion-demo">
      <div className="floating-element">✨</div>
      <div className="floating-element">🌟</div>
      <div className="floating-element">💫</div>
    </div>
  </section>,

  <section key="integration" className="section-content section-4">
    <h1 className="section-title">Integration</h1>
    <p className="section-subtitle">GSAP + Lenis + React 18</p>
    <p className="section-description">
      Simple integration with existing React applications. 
      Comes with TypeScript support, comprehensive error handling, 
      and optimized performance patterns out of the box.
    </p>
    <div className="code-preview">
      <code>
        {`<StoryScrollerWithErrorBoundary
  sections={sections}
  duration={1.2}
  enableMagneticSnap={true}
  onSectionChange={(index) => {
    console.log('Section:', index)
  }}
/>`}
      </code>
    </div>
  </section>,

  <section key="demo" className="section-content section-5">
    <h1 className="section-title">Ready</h1>
    <p className="section-subtitle">Start building narrative experiences</p>
    <p className="section-description">
      This demo showcases the full capabilities of StoryScroller. 
      Try the navigation controls, keyboard shortcuts (↑↓), 
      or simply scroll to experience the smooth section snapping.
    </p>
    <a href="https://github.com/ryleebrasseur/story-scroller" className="section-cta">
      Get Started →
    </a>
  </section>,
];

// Enhanced error fallback component
const ErrorFallback = ({ error, resetError }: { error?: Error, resetError?: () => void }) => (
  <div className="error-container">
    <h1 className="error-title">⚠️ Oops!</h1>
    <p className="error-message">Something went wrong with the StoryScroller.</p>
    {error && (
      <details className="error-details">
        <summary>Error Details</summary>
        <pre>{error.message}</pre>
      </details>
    )}
    {resetError && (
      <button onClick={resetError} className="error-reset-btn">
        Try Again
      </button>
    )}
  </div>
);

// Configuration controls component
function ConfigurationControls() {
  const [config, setConfig] = useState<Partial<StoryScrollerConfig>>({
    duration: 1.2,
    enableMagneticSnap: true,
    keyboardNavigation: true,
    tolerance: 50,
  });

  const updateConfig = useCallback((updates: Partial<StoryScrollerConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="config-panel">
      <h3>Configuration</h3>
      <div className="config-controls">
        <label>
          Duration: {config.duration}s
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={config.duration}
            onChange={(e) => updateConfig({ duration: parseFloat(e.target.value) })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.enableMagneticSnap}
            onChange={(e) => updateConfig({ enableMagneticSnap: e.target.checked })}
          />
          Magnetic Snap
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.keyboardNavigation}
            onChange={(e) => updateConfig({ keyboardNavigation: e.target.checked })}
          />
          Keyboard Navigation
        </label>
      </div>
    </div>
  );
}

// Section indicators component
function SectionIndicators() {
  const { state } = useScrollContext();
  const sections = createSections();

  const handleSectionClick = (index: number) => {
    if ((window as any).storyScrollerAPI) {
      (window as any).storyScrollerAPI.gotoSection(index);
    }
  };

  return (
    <div className="section-indicators">
      {sections.map((_, index) => (
        <button
          key={index}
          className={`indicator ${index === state.currentIndex ? 'active' : ''}`}
          onClick={() => handleSectionClick(index)}
          aria-label={`Go to section ${index + 1}`}
        />
      ))}
    </div>
  );
}

// Enhanced navigation UI
function NavigationUI() {
  const { state } = useScrollContext();
  const sectionsCount = createSections().length;

  const handleNext = () => {
    if ((window as any).storyScrollerAPI) {
      (window as any).storyScrollerAPI.nextSection();
    }
  };

  const handlePrev = () => {
    if ((window as any).storyScrollerAPI) {
      (window as any).storyScrollerAPI.prevSection();
    }
  };

  return (
    <nav className="nav-ui">
      <div className="nav-controls">
        <button 
          className="nav-button"
          onClick={handlePrev} 
          disabled={state.currentIndex === 0}
          aria-label="Previous section"
        >
          ← Prev
        </button>
        
        <div className="nav-info">
          <span className="current-section">
            {state.currentIndex + 1} / {sectionsCount}
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((state.currentIndex + 1) / sectionsCount) * 100}%` }}
            />
          </div>
        </div>
        
        <button 
          className="nav-button"
          onClick={handleNext} 
          disabled={state.currentIndex === sectionsCount - 1}
          aria-label="Next section"
        >
          Next →
        </button>
      </div>
      
      <div className="nav-status">
        {state.isAnimating && <span className="status-indicator animating">Animating</span>}
      </div>
    </nav>
  );
}

// Main app content with enhanced features
function AppContent() {
  const sections = createSections();
  const { state } = useScrollContext();
  
  // Advanced configuration with all the new features
  const storyScrollerConfig: StoryScrollerConfig = {
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing
    tolerance: 50,
    enableMagneticSnap: true,
    magneticThreshold: 0.15,
    magneticVelocityThreshold: 5,
    keyboardNavigation: true,
    onSectionChange: (index: number) => {
      console.log(`📍 Section changed to: ${index + 1}`);
    },
    containerClassName: 'story-scroller-container',
    sectionClassName: 'story-scroller-section',
  };

  return (
    <>
      <StoryScrollerWithErrorBoundary
        sections={sections}
        errorFallback={<ErrorFallback />}
        {...storyScrollerConfig}
      />
      
      <NavigationUI />
      <SectionIndicators />
      
      {/* Debug info panel */}
      <div className="debug-panel">
        <h4>Debug Info</h4>
        <div className="debug-info">
          <div>Current: {state.currentIndex + 1}</div>
          <div>Animating: {state.isAnimating ? 'Yes' : 'No'}</div>
          <div>Last Scroll: {state.lastScrollTime ? new Date(state.lastScrollTime).toLocaleTimeString() : 'N/A'}</div>
        </div>
      </div>
    </>
  );
}

// Main app with error boundary
function App() {
  return (
    <ScrollProvider>
      <AppContent />
    </ScrollProvider>
  );
}

export default App;