// Main exports
export { StoryScroller } from './components/StoryScroller'
export { StoryScrollerWithErrorBoundary } from './components/StoryScrollerWithErrorBoundary'
export { StoryScrollerErrorBoundary } from './components/StoryScrollerErrorBoundary'
export { useStoryScroller } from './hooks/useStoryScroller'

// Debouncing exports
export { useDebouncing } from './hooks/useDebouncing'
export type { DebounceConfig, DebounceState, DebugInfo } from './hooks/useDebouncing'

// Context exports
export { 
  ScrollProvider, 
  useScrollContext, 
  useScrollActions 
} from './context/ScrollContext'

// Type exports
export type {
  StorySection,
  StoryScrollerConfig,
  StoryScrollerProps,
} from './types'

// State management exports
export {
  scrollReducer,
  createInitialState,
  scrollActions,
  scrollSelectors,
  type ScrollState,
  type ScrollAction,
} from './state/scrollReducer'

// Service exports
export {
  BrowserService,
  MockBrowserService,
  createBrowserService,
  type IBrowserService,
} from './services/BrowserService'

// Style imports - consumers should import separately:
// import '@ryleebrasseur/story-scroller/styles'