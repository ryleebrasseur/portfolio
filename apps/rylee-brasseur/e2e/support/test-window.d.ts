// Type definitions for test-specific window properties
export interface TestWindow extends Window {
  testGotoSection?: (section: string) => void
  currentIndexRef?: { current?: number }
  __motionState?: Record<string, unknown>
  __observerState?: Record<string, unknown>
  buttonClicked?: () => void
}

// Extend the global Window interface for tests
declare global {
  interface Window {
    testGotoSection?: (section: string) => void
    currentIndexRef?: { current?: number }
    __motionState?: Record<string, unknown>
    __observerState?: Record<string, unknown>
    buttonClicked?: () => void
  }
}
