// Main exports
export { StoryScroller } from './components/StoryScroller'
export { useStoryScroller } from './hooks/useStoryScroller'

// Type exports
export type {
  StorySection,
  StoryScrollerConfig,
  StoryScrollerProps,
  ScrollState,
} from './types'

// Style imports - consumers should import separately:
// import '@ryleebrasseur/story-scroller/styles'