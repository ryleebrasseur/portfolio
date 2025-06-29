import { vi, expect } from 'vitest';
import '@testing-library/jest-dom';

// Mock Lenis
export const mockLenis = {
  on: vi.fn(),
  off: vi.fn(),
  scrollTo: vi.fn(),
  destroy: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  resize: vi.fn(),
  progress: 0,
  targetScroll: 0,
  actualScroll: 0,
  isScrolling: false,
};

export const createMockLenis = () => ({
  ...mockLenis,
  on: vi.fn(),
  off: vi.fn(),
  scrollTo: vi.fn(),
  destroy: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  resize: vi.fn(),
});

vi.mock('lenis', () => ({
  default: vi.fn().mockImplementation(() => createMockLenis()),
}));

// Mock GSAP
export const mockGsap = {
  ticker: {
    add: vi.fn(),
    remove: vi.fn(),
    lagSmoothing: vi.fn(),
  },
  to: vi.fn(),
  fromTo: vi.fn(),
  set: vi.fn(),
  timeline: vi.fn(() => ({
    to: vi.fn().mockReturnThis(),
    fromTo: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    pause: vi.fn().mockReturnThis(),
    kill: vi.fn().mockReturnThis(),
  })),
  utils: {
    clamp: vi.fn((min: number, max: number, value: number) => 
      Math.max(min, Math.min(max, value))
    ),
  },
  registerPlugin: vi.fn(),
};

vi.mock('gsap', () => ({
  default: mockGsap,
  ...mockGsap,
}));

// Mock ScrollTrigger
export const mockScrollTrigger = {
  create: vi.fn(),
  batch: vi.fn(),
  refresh: vi.fn(),
  update: vi.fn(),
  getAll: vi.fn(() => []),
  killAll: vi.fn(),
  normalizeScroll: vi.fn(),
  config: vi.fn(),
};

vi.mock('gsap/ScrollTrigger', () => ({
  default: mockScrollTrigger,
  ScrollTrigger: mockScrollTrigger,
}));

// Mock Observer
vi.mock('gsap/Observer', () => ({
  default: { name: 'Observer' },
  Observer: { name: 'Observer' },
}));

// Mock ScrollToPlugin
vi.mock('gsap/ScrollToPlugin', () => ({
  default: { name: 'ScrollToPlugin' },
  ScrollToPlugin: { name: 'ScrollToPlugin' },
}));

// Mock ResizeObserver
export class MockResizeObserver {
  callback: ResizeObserverCallback;
  observedElements: Set<Element> = new Set();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    this.observedElements.add(element);
  }

  unobserve(element: Element) {
    this.observedElements.delete(element);
  }

  disconnect() {
    this.observedElements.clear();
  }

  // Helper to trigger resize
  triggerResize(entries: Partial<ResizeObserverEntry>[] = []) {
    const defaultEntry: ResizeObserverEntry = {
      target: document.createElement('div'),
      contentRect: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON: () => ({}),
      },
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    };

    const finalEntries = entries.map(entry => ({ ...defaultEntry, ...entry }));
    this.callback(finalEntries as ResizeObserverEntry[], this as any);
  }
}

// Mock window.matchMedia
export const mockMatchMedia = (matches: boolean = false) => ({
  matches,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Setup global mocks
if (typeof global !== 'undefined') {
  global.ResizeObserver = MockResizeObserver as any;
  global.matchMedia = vi.fn().mockImplementation(() => mockMatchMedia());
}

// Mock requestAnimationFrame
export const mockRAF = {
  callbacks: [] as Array<{ id: number; callback: FrameRequestCallback }>,
  nextId: 1,
  
  requestAnimationFrame: vi.fn((callback: FrameRequestCallback) => {
    const id = mockRAF.nextId++;
    mockRAF.callbacks.push({ id, callback });
    return id;
  }),
  
  cancelAnimationFrame: vi.fn((id: number) => {
    mockRAF.callbacks = mockRAF.callbacks.filter(cb => cb.id !== id);
  }),
  
  flush: (time: number = 16) => {
    const callbacks = [...mockRAF.callbacks];
    mockRAF.callbacks = [];
    callbacks.forEach(({ callback }) => callback(time));
  },
  
  reset: () => {
    mockRAF.callbacks = [];
    mockRAF.nextId = 1;
    mockRAF.requestAnimationFrame.mockClear();
    mockRAF.cancelAnimationFrame.mockClear();
  },
};

if (typeof global !== 'undefined') {
  global.requestAnimationFrame = mockRAF.requestAnimationFrame as any;
  global.cancelAnimationFrame = mockRAF.cancelAnimationFrame as any;
}

// Mock window.scrollTo
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
  window.scroll = vi.fn();
}