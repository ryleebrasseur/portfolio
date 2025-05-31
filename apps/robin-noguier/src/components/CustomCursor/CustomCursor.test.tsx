import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import CustomCursor from './CustomCursor'

describe('CustomCursor', () => {
  beforeEach(() => {
    // Mock window.matchMedia for reduced motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('should render without errors', () => {
    const { container } = render(<CustomCursor />)
    expect(container).toBeTruthy()
  })

  it('should handle mouseenter events on non-element targets', () => {
    render(<CustomCursor />)

    // Create a mock event with a non-element target
    const mockEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
    })

    // Override the target to be a text node (no matches method)
    Object.defineProperty(mockEvent, 'target', {
      value: document.createTextNode('test'),
      writable: false,
    })

    // This should not throw an error
    expect(() => {
      document.dispatchEvent(mockEvent)
    }).not.toThrow()
  })

  it('should handle mouseenter events on elements without matches method', () => {
    render(<CustomCursor />)

    // Create a mock event with an object that doesn't have matches
    const mockEvent = new MouseEvent('mouseenter', {
      bubbles: true,
      cancelable: true,
    })

    // Create a mock target without matches method
    const mockTarget = {
      nodeType: 1, // Element node
      // No matches method
    }

    Object.defineProperty(mockEvent, 'target', {
      value: mockTarget,
      writable: false,
    })

    // This should not throw an error
    expect(() => {
      document.dispatchEvent(mockEvent)
    }).not.toThrow()
  })

  it('should hide cursor when prefers-reduced-motion is set', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { container } = render(<CustomCursor />)
    const cursor = container.querySelector('[class*="cursor"]')
    expect(cursor).toBeNull()
  })
})
