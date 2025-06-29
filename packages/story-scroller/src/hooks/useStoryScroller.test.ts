// Export a simple test version of useStoryScroller for tests
import { useStoryScrollerContext } from '../context/StoryScrollerContext';

export function useStoryScroller() {
  return useStoryScrollerContext();
}