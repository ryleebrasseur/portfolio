import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock window methods that GSAP/Lenis might use
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true,
})

Object.defineProperty(window, 'innerHeight', {
  value: 768,
  writable: true,
})

Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true,
})

// Mock requestAnimationFrame for tests
let animationFrameId = 0
global.requestAnimationFrame = vi.fn((callback) => {
  animationFrameId++
  setTimeout(() => callback(animationFrameId), 16) // ~60fps
  return animationFrameId
})

global.cancelAnimationFrame = vi.fn()

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(function() {
  return {
    top: 0,
    left: 0,
    bottom: 768,
    right: 1024,
    width: 1024,
    height: 768,
    x: 0,
    y: 0,
    toJSON: () => {},
  }
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Suppress console errors during tests (GSAP warnings, etc.)
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('GSAP') || args[0].includes('ScrollTrigger'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Mock matchMedia
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))