import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Test setup file for Vitest
// Add any global test setup needed here

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.scrollTo
window.scrollTo = vi.fn()
