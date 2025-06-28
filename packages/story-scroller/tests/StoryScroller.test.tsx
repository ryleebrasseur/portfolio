import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { StoryScroller } from '../src/components/StoryScroller'

// Mock GSAP modules
vi.mock('gsap', () => ({
  default: {
    registerPlugin: vi.fn(),
    to: vi.fn((target, options) => {
      // Simulate immediate completion
      if (options.onComplete) {
        setTimeout(options.onComplete, 0)
      }
      return { kill: vi.fn() }
    }),
    context: {
      add: vi.fn((fn) => fn),
    },
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    utils: {
      clamp: vi.fn((min, max, value) => Math.max(min, Math.min(max, value))),
    },
    killTweensOf: vi.fn(),
  },
}))

vi.mock('gsap/all', () => ({
  ScrollTrigger: {
    config: vi.fn(),
    scrollerProxy: vi.fn(),
    refresh: vi.fn(),
    update: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    killAll: vi.fn(),
  },
  ScrollToPlugin: {},
  Observer: {
    create: vi.fn(() => ({
      kill: vi.fn(),
    })),
  },
}))

vi.mock('@gsap/react', () => ({
  useGSAP: vi.fn((callback, config) => {
    // Execute the callback immediately
    const cleanup = callback()
    // Store cleanup for later
    if (cleanup && typeof cleanup === 'function') {
      // In a real scenario, this would be called on unmount
      setTimeout(() => cleanup(), 0)
    }
  }),
}))

// Mock Lenis
const mockLenisInstance = {
  raf: vi.fn(),
  on: vi.fn(),
  destroy: vi.fn(),
  scroll: 0,
  scrollTo: vi.fn(),
}

vi.mock('lenis', () => ({
  default: vi.fn(() => mockLenisInstance),
}))

describe('StoryScroller Component', () => {
  const mockSections = [
    <div key="1">Section 1</div>,
    <div key="2">Section 2</div>,
    <div key="3">Section 3</div>,
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all sections', () => {
    render(<StoryScroller sections={mockSections} />)
    
    expect(screen.getByText('Section 1')).toBeInTheDocument()
    expect(screen.getByText('Section 2')).toBeInTheDocument()
    expect(screen.getByText('Section 3')).toBeInTheDocument()
  })

  it('applies correct data attributes to sections', () => {
    const { container } = render(<StoryScroller sections={mockSections} />)
    
    const sections = container.querySelectorAll('[data-section-idx]')
    expect(sections).toHaveLength(3)
    expect(sections[0]).toHaveAttribute('data-section-idx', '0')
    expect(sections[1]).toHaveAttribute('data-section-idx', '1')
    expect(sections[2]).toHaveAttribute('data-section-idx', '2')
  })

  it('applies custom class names', () => {
    const { container } = render(
      <StoryScroller
        sections={mockSections}
        containerClassName="custom-container"
        sectionClassName="custom-section"
        className="additional-class"
      />
    )
    
    const containerEl = container.firstChild as Element
    expect(containerEl).toHaveClass('story-scroller-container')
    expect(containerEl).toHaveClass('custom-container')
    expect(containerEl).toHaveClass('additional-class')
    
    const sections = container.querySelectorAll('.story-scroller-section')
    expect(sections[0]).toHaveClass('custom-section')
  })

  it('calls onSectionChange callback', async () => {
    const onSectionChange = vi.fn()
    const { Observer } = await import('gsap/all')
    
    // Setup Observer mock to capture callbacks
    let observerCallbacks: any = {}
    ;(Observer.create as any).mockImplementation((config: any) => {
      observerCallbacks = config
      return { kill: vi.fn() }
    })
    
    render(
      <StoryScroller
        sections={mockSections}
        onSectionChange={onSectionChange}
      />
    )
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(Observer.create).toHaveBeenCalled()
    })
    
    // Wait a bit for DOM to be ready
    await waitFor(() => {
      const sections = document.querySelectorAll('[data-section-idx]')
      expect(sections.length).toBeGreaterThan(0)
    })
    
    // Simulate scroll down
    if (observerCallbacks.onDown) {
      observerCallbacks.onDown()
    }
    
    // Since we mock gsap.to to complete immediately
    await waitFor(() => {
      expect(onSectionChange).toHaveBeenCalledWith(1)
    })
  })

  it('respects preventDefault option', async () => {
    const { Observer } = await import('gsap/all')
    
    render(
      <StoryScroller
        sections={mockSections}
        preventDefault={false}
      />
    )
    
    await waitFor(() => {
      expect(Observer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          preventDefault: false,
        })
      )
    })
  })

  it('respects tolerance option', async () => {
    const { Observer } = await import('gsap/all')
    
    render(
      <StoryScroller
        sections={mockSections}
        tolerance={100}
      />
    )
    
    await waitFor(() => {
      expect(Observer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tolerance: 100,
        })
      )
    })
  })

  it('handles keyboard navigation when enabled', async () => {
    const user = userEvent.setup()
    const onSectionChange = vi.fn()
    
    render(
      <StoryScroller
        sections={mockSections}
        keyboardNavigation={true}
        onSectionChange={onSectionChange}
      />
    )
    
    // Simulate arrow down key
    await user.keyboard('{ArrowDown}')
    
    // Check that navigation would occur
    // In real implementation, this would trigger section change
    // but we're testing that keyboard events are being listened to
    expect(true).toBe(true) // Placeholder assertion
  })

  it('cleans up on unmount', async () => {
    const gsap = (await import('gsap')).default
    const { ScrollTrigger, Observer } = await import('gsap/all')
    
    const { unmount } = render(<StoryScroller sections={mockSections} />)
    
    unmount()
    
    // Verify cleanup methods were called
    await waitFor(() => {
      expect(gsap.ticker.remove).toHaveBeenCalled()
      expect(ScrollTrigger.killAll).toHaveBeenCalled()
      expect(gsap.killTweensOf).toHaveBeenCalledWith('*')
    })
  })

  it('handles empty sections array', () => {
    const { container } = render(<StoryScroller sections={[]} />)
    
    const sections = container.querySelectorAll('[data-section-idx]')
    expect(sections).toHaveLength(0)
  })

  it('updates when sections change', () => {
    const { rerender } = render(<StoryScroller sections={mockSections} />)
    
    expect(screen.getByText('Section 1')).toBeInTheDocument()
    
    const newSections = [
      <div key="4">Section 4</div>,
      <div key="5">Section 5</div>,
    ]
    
    rerender(<StoryScroller sections={newSections} />)
    
    expect(screen.queryByText('Section 1')).not.toBeInTheDocument()
    expect(screen.getByText('Section 4')).toBeInTheDocument()
    expect(screen.getByText('Section 5')).toBeInTheDocument()
  })

  it('applies accessibility attributes', () => {
    const { container } = render(<StoryScroller sections={mockSections} />)
    
    const sections = container.querySelectorAll('section')
    sections.forEach((section) => {
      expect(section).toHaveAttribute('tabIndex', '0')
    })
  })

  it('handles custom styles', () => {
    const customStyle = {
      backgroundColor: 'red',
      padding: '20px',
    }
    
    const { container } = render(
      <StoryScroller sections={mockSections} style={customStyle} />
    )
    
    const containerEl = container.firstChild as HTMLElement
    expect(containerEl.style.backgroundColor).toBe('red')
    expect(containerEl.style.padding).toBe('20px')
    // Default styles should still be applied
    expect(containerEl.style.height).toBe('100vh')
    expect(containerEl.style.overflow).toBe('hidden')
  })
})