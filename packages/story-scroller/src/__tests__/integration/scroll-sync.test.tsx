import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { StoryScroller } from '../../components/StoryScroller';
import { useStoryScroller } from '../../hooks/useStoryScroller';
import { 
  render, 
  createTestStories,
  waitForLenis,
  setupTestDocument,
  cleanupTestDocument,
} from '../setup/test-utils';
import { mockLenis, mockRAF } from '../setup/mocks';
import React from 'react';

// Component to test hook state synchronization
const StateObserver = ({ onUpdate }: { onUpdate: (state: any) => void }) => {
  const state = useStoryScroller();
  
  React.useEffect(() => {
    onUpdate(state);
  }, [state, onUpdate]);
  
  return null;
};

describe('StoryScroller Scroll Synchronization', () => {
  const stories = createTestStories(5);
  const storyHeight = 768;

  beforeEach(() => {
    vi.useFakeTimers();
    setupTestDocument();
    mockRAF.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    cleanupTestDocument();
  });

  describe('scroll to state synchronization', () => {
    it('should update current story based on scroll position', async () => {
      const stateUpdates: any[] = [];
      const captureState = (state: any) => stateUpdates.push({ ...state });

      render(
        <>
          <StoryScroller />
          <StateObserver onUpdate={captureState} />
        </>
      );
      await waitForLenis();

      // Get scroll handler
      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Simulate scrolling to different positions
      scrollHandler?.({ 
        scroll: 0, 
        limit: storyHeight * 4, 
        progress: 0 
      });

      await waitFor(() => {
        const lastUpdate = stateUpdates[stateUpdates.length - 1];
        expect(lastUpdate.currentStoryId).toBe('story-1');
        expect(lastUpdate.currentStoryIndex).toBe(0);
      });

      // Scroll to second story
      stateUpdates.length = 0;
      scrollHandler?.({ 
        scroll: storyHeight, 
        limit: storyHeight * 4, 
        progress: 0.25 
      });

      await waitFor(() => {
        const lastUpdate = stateUpdates[stateUpdates.length - 1];
        expect(lastUpdate.currentStoryId).toBe('story-2');
        expect(lastUpdate.currentStoryIndex).toBe(1);
      });
    });

    it('should update scroll progress continuously', async () => {
      const progressUpdates: number[] = [];
      const onScrollProgress = (progress: number) => progressUpdates.push(progress);

      render(<StoryScroller onScrollProgress={onScrollProgress} />);
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Simulate gradual scroll
      for (let i = 0; i <= 10; i++) {
        scrollHandler?.({ 
          scroll: i * 100, 
          limit: 3000, 
          progress: i * 0.1 
        });
      }

      expect(progressUpdates).toHaveLength(11);
      expect(progressUpdates[0]).toBe(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBeCloseTo(1, 1);
    });

    it('should handle scroll position between stories', async () => {
      const stateUpdates: any[] = [];
      const captureState = (state: any) => stateUpdates.push({ ...state });

      render(
        <>
          <StoryScroller />
          <StateObserver onUpdate={captureState} />
        </>
      );
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Scroll to position between story 1 and 2
      scrollHandler?.({ 
        scroll: storyHeight * 0.6, 
        limit: storyHeight * 4, 
        progress: 0.15 
      });

      await waitFor(() => {
        const lastUpdate = stateUpdates[stateUpdates.length - 1];
        // Should still be on story 1 (threshold not crossed)
        expect(lastUpdate.currentStoryId).toBe('story-1');
      });

      // Scroll past threshold
      scrollHandler?.({ 
        scroll: storyHeight * 0.8, 
        limit: storyHeight * 4, 
        progress: 0.2 
      });

      await waitFor(() => {
        const lastUpdate = stateUpdates[stateUpdates.length - 1];
        // Should now be on story 2
        expect(lastUpdate.currentStoryId).toBe('story-2');
      });
    });
  });

  describe('state to scroll synchronization', () => {
    it('should scroll when story changes via hook', async () => {
      let hookResult: any;
      
      const TestComponent = () => {
        hookResult = useStoryScroller();
        return <StoryScroller />;
      };

      render(<TestComponent />);
      await waitForLenis();

      // Navigate using hook
      await hookResult.navigateToStory('story-3');

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(
          storyHeight * 2,
          expect.any(Object)
        );
      });
    });

    it('should maintain sync when mixing navigation methods', async () => {
      let hookResult: any;
      
      const TestComponent = () => {
        hookResult = useStoryScroller();
        return <StoryScroller showNavigation={true} enableKeyboardNavigation={true} />;
      };

      render(<TestComponent />);
      await waitForLenis();

      // Navigate via hook
      await hookResult.navigateToIndex(1);
      
      await waitFor(() => {
        expect(hookResult.currentStoryIndex).toBe(1);
      });

      // Navigate via indicator
      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      indicators[2].click();

      await waitFor(() => {
        expect(hookResult.currentStoryIndex).toBe(2);
      });

      // Verify scroll position updated
      expect(mockLenis.scrollTo).toHaveBeenLastCalledWith(
        storyHeight * 2,
        expect.any(Object)
      );
    });
  });

  describe('multi-component synchronization', () => {
    it('should sync state across multiple components', async () => {
      const states: any[] = [];
      
      const Observer1 = () => {
        const state = useStoryScroller();
        React.useEffect(() => {
          states.push({ component: 1, ...state });
        }, [state.currentStoryIndex]);
        return null;
      };

      const Observer2 = () => {
        const state = useStoryScroller();
        React.useEffect(() => {
          states.push({ component: 2, ...state });
        }, [state.currentStoryIndex]);
        return null;
      };

      render(
        <>
          <StoryScroller />
          <Observer1 />
          <Observer2 />
        </>
      );
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Trigger scroll
      scrollHandler?.({ 
        scroll: storyHeight, 
        limit: storyHeight * 4, 
        progress: 0.25 
      });

      await waitFor(() => {
        const recentStates = states.slice(-2);
        expect(recentStates.every(s => s.currentStoryIndex === 1)).toBe(true);
      });
    });

    it('should handle concurrent updates gracefully', async () => {
      let hookResult1: any;
      let hookResult2: any;
      
      const TestComponent = () => {
        hookResult1 = useStoryScroller();
        hookResult2 = useStoryScroller();
        return <StoryScroller />;
      };

      render(<TestComponent />);
      await waitForLenis();

      // Try concurrent navigation
      const nav1 = hookResult1.navigateToIndex(2);
      const nav2 = hookResult2.navigateToIndex(3);

      await Promise.all([nav1, nav2]);

      // Both hooks should reflect the same final state
      expect(hookResult1.currentStoryIndex).toBe(hookResult2.currentStoryIndex);
      
      // Only one navigation should have succeeded
      expect(mockLenis.scrollTo).toHaveBeenCalledTimes(1);
    });
  });

  describe('scroll progress tracking', () => {
    it('should calculate story-specific progress', async () => {
      const progressData: Array<{ storyId: string; progress: number }> = [];
      
      const ProgressTracker = () => {
        const { currentStoryId, scrollProgress } = useStoryScroller();
        React.useEffect(() => {
          progressData.push({ storyId: currentStoryId || '', progress: scrollProgress });
        }, [currentStoryId, scrollProgress]);
        return null;
      };

      render(
        <>
          <StoryScroller />
          <ProgressTracker />
        </>
      );
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Scroll through first story
      for (let i = 0; i <= 10; i++) {
        scrollHandler?.({ 
          scroll: (storyHeight * i) / 10, 
          limit: storyHeight * 4, 
          progress: i / 40 
        });
      }

      // Progress should increase for story-1
      const story1Progress = progressData.filter(p => p.storyId === 'story-1');
      expect(story1Progress.length).toBeGreaterThan(0);
      expect(story1Progress[0].progress).toBeLessThan(
        story1Progress[story1Progress.length - 1].progress
      );
    });

    it('should reset progress when changing stories', async () => {
      let currentProgress = 0;
      
      const ProgressObserver = () => {
        const { scrollProgress } = useStoryScroller();
        currentProgress = scrollProgress;
        return null;
      };

      render(
        <>
          <StoryScroller />
          <ProgressObserver />
        </>
      );
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Scroll partway through first story
      scrollHandler?.({ 
        scroll: storyHeight * 0.5, 
        limit: storyHeight * 4, 
        progress: 0.125 
      });

      await waitFor(() => {
        expect(currentProgress).toBeGreaterThan(0);
      });

      // Jump to third story
      scrollHandler?.({ 
        scroll: storyHeight * 2, 
        limit: storyHeight * 4, 
        progress: 0.5 
      });

      // Progress should reflect position in overall scroll
      await waitFor(() => {
        expect(currentProgress).toBe(0.5);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle rapid scroll direction changes', async () => {
      const storyChanges: string[] = [];
      
      render(
        <StoryScroller 
          onStoryChange={(id) => storyChanges.push(id)}
        />
      );
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Rapid back and forth scrolling
      scrollHandler?.({ scroll: 0, limit: storyHeight * 4, progress: 0 });
      scrollHandler?.({ scroll: storyHeight, limit: storyHeight * 4, progress: 0.25 });
      scrollHandler?.({ scroll: 0, limit: storyHeight * 4, progress: 0 });
      scrollHandler?.({ scroll: storyHeight * 2, limit: storyHeight * 4, progress: 0.5 });

      await waitFor(() => {
        expect(storyChanges.length).toBeGreaterThan(0);
        expect(storyChanges[storyChanges.length - 1]).toBe('story-3');
      });
    });

    it('should handle scroll beyond content', async () => {
      const onScrollProgress = vi.fn();
      
      render(<StoryScroller onScrollProgress={onScrollProgress} />);
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Scroll beyond content (elastic scroll)
      scrollHandler?.({ 
        scroll: storyHeight * 10, 
        limit: storyHeight * 4, 
        progress: 2.5 
      });

      await waitFor(() => {
        // Progress should be clamped to 1
        expect(onScrollProgress).toHaveBeenLastCalledWith(1);
      });
    });

    it('should handle negative scroll positions', async () => {
      const onScrollProgress = vi.fn();
      
      render(<StoryScroller onScrollProgress={onScrollProgress} />);
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Negative scroll (elastic scroll at top)
      scrollHandler?.({ 
        scroll: -100, 
        limit: storyHeight * 4, 
        progress: -0.025 
      });

      await waitFor(() => {
        // Progress should be clamped to 0
        expect(onScrollProgress).toHaveBeenLastCalledWith(0);
      });
    });

    it('should maintain sync during resize', async () => {
      let currentStoryBefore: string | null;
      let currentStoryAfter: string | null;
      
      const ResizeObserver = () => {
        const { currentStoryId } = useStoryScroller();
        if (!currentStoryBefore) currentStoryBefore = currentStoryId;
        else currentStoryAfter = currentStoryId;
        return null;
      };

      render(
        <>
          <StoryScroller />
          <ResizeObserver />
        </>
      );
      await waitForLenis();

      // Scroll to second story
      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      scrollHandler?.({ 
        scroll: storyHeight, 
        limit: storyHeight * 4, 
        progress: 0.25 
      });

      await waitFor(() => {
        expect(currentStoryBefore).toBe('story-2');
      });

      // Simulate resize
      window.dispatchEvent(new Event('resize'));
      mockLenis.resize();

      await waitFor(() => {
        // Story should remain the same after resize
        expect(currentStoryAfter).toBe('story-2');
      });
    });
  });

  describe('memory and cleanup', () => {
    it('should not leak memory on unmount', async () => {
      const { unmount } = render(<StoryScroller />);
      await waitForLenis();

      // Get all registered callbacks
      const scrollCallbacks = mockLenis.on.mock.calls.filter(
        call => call[0] === 'scroll'
      );

      unmount();

      // All callbacks should be unregistered
      expect(mockLenis.off).toHaveBeenCalledTimes(scrollCallbacks.length);
    });

    it('should clean up scroll listeners properly', async () => {
      const { unmount } = render(<StoryScroller />);
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      unmount();

      // Try to trigger scroll after unmount
      if (scrollHandler) {
        expect(() => {
          scrollHandler({ scroll: 100, limit: 1000, progress: 0.1 });
        }).not.toThrow();
      }
    });
  });
});