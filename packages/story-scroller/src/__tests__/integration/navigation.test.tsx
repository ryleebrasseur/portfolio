import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { StoryScroller } from '../../components/StoryScroller';
import { 
  render, 
  createTestStories,
  simulateKeyPress,
  waitForLenis,
  setupTestDocument,
  cleanupTestDocument,
} from '../setup/test-utils';
import { mockLenis, mockRAF } from '../setup/mocks';

describe('StoryScroller Navigation', () => {
  const stories = createTestStories(5);

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

  describe('keyboard navigation', () => {
    it('should navigate to next story with ArrowDown', async () => {
      render(<StoryScroller enableKeyboardNavigation={true} />);
      await waitForLenis();

      await simulateKeyPress('ArrowDown');

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(
          768, // Second story position
          expect.objectContaining({ duration: 1.2 })
        );
      });
    });

    it('should navigate to previous story with ArrowUp', async () => {
      render(<StoryScroller enableKeyboardNavigation={true} />, {
        initialStoryId: 'story-2',
      });
      await waitForLenis();

      await simulateKeyPress('ArrowUp');

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(
          0, // First story position
          expect.objectContaining({ duration: 1.2 })
        );
      });
    });

    it('should navigate with Page Down/Up keys', async () => {
      render(<StoryScroller enableKeyboardNavigation={true} />);
      await waitForLenis();

      await simulateKeyPress('PageDown');
      
      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(768, expect.any(Object));
      });

      vi.clearAllMocks();

      await simulateKeyPress('PageUp');
      
      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(0, expect.any(Object));
      });
    });

    it('should navigate to first story with Home key', async () => {
      render(<StoryScroller enableKeyboardNavigation={true} />, {
        initialStoryId: 'story-3',
      });
      await waitForLenis();

      await simulateKeyPress('Home');

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(
          0,
          expect.objectContaining({ duration: 1.2 })
        );
      });
    });

    it('should navigate to last story with End key', async () => {
      render(<StoryScroller enableKeyboardNavigation={true} />);
      await waitForLenis();

      await simulateKeyPress('End');

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(
          3072, // Last story position (5th story)
          expect.objectContaining({ duration: 1.2 })
        );
      });
    });

    it('should not navigate when disabled', async () => {
      render(<StoryScroller enableKeyboardNavigation={false} />);
      await waitForLenis();

      await simulateKeyPress('ArrowDown');
      await vi.advanceTimersByTime(100);

      expect(mockLenis.scrollTo).not.toHaveBeenCalled();
    });

    it('should prevent navigation during ongoing navigation', async () => {
      render(<StoryScroller enableKeyboardNavigation={true} />);
      await waitForLenis();

      // Start navigation
      await simulateKeyPress('ArrowDown');
      
      // Try another navigation immediately
      await simulateKeyPress('ArrowDown');

      // Should only navigate once
      expect(mockLenis.scrollTo).toHaveBeenCalledTimes(1);
    });

    it('should handle navigation at boundaries', async () => {
      render(<StoryScroller enableKeyboardNavigation={true} />);
      await waitForLenis();

      // At first story, try to go up
      await simulateKeyPress('ArrowUp');
      
      // Should not navigate
      expect(mockLenis.scrollTo).not.toHaveBeenCalled();

      // Navigate to last story
      await simulateKeyPress('End');
      vi.clearAllMocks();

      // At last story, try to go down
      await simulateKeyPress('ArrowDown');
      
      // Should not navigate
      await vi.advanceTimersByTime(100);
      expect(mockLenis.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('touch/swipe navigation', () => {
    it('should navigate on vertical swipe', async () => {
      render(<StoryScroller enableTouchNavigation={true} />);
      await waitForLenis();

      const container = screen.getByTestId('story-scroller');

      // Simulate swipe down
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 50 }],
      });
      
      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 100, clientY: 50 }],
      });

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(
          768,
          expect.any(Object)
        );
      });
    });

    it('should not navigate on horizontal swipe', async () => {
      render(<StoryScroller enableTouchNavigation={true} />);
      await waitForLenis();

      const container = screen.getByTestId('story-scroller');

      // Simulate horizontal swipe
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 200, clientY: 100 }],
      });
      
      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      });

      await vi.advanceTimersByTime(100);
      expect(mockLenis.scrollTo).not.toHaveBeenCalled();
    });

    it('should require minimum swipe distance', async () => {
      render(<StoryScroller enableTouchNavigation={true} />);
      await waitForLenis();

      const container = screen.getByTestId('story-scroller');

      // Small swipe (less than threshold)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchMove(container, {
        touches: [{ clientX: 100, clientY: 95 }],
      });
      
      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 100, clientY: 95 }],
      });

      await vi.advanceTimersByTime(100);
      expect(mockLenis.scrollTo).not.toHaveBeenCalled();
    });

    it('should handle multi-touch gestures', async () => {
      render(<StoryScroller enableTouchNavigation={true} />);
      await waitForLenis();

      const container = screen.getByTestId('story-scroller');

      // Multi-touch (should be ignored)
      fireEvent.touchStart(container, {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 },
        ],
      });

      fireEvent.touchEnd(container, {
        changedTouches: [{ clientX: 100, clientY: 50 }],
      });

      await vi.advanceTimersByTime(100);
      expect(mockLenis.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('navigation indicators', () => {
    it('should highlight current story indicator', async () => {
      render(<StoryScroller showNavigation={true} />);
      await waitForLenis();

      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      
      expect(indicators[0]).toHaveAttribute('aria-current', 'true');
      expect(indicators[1]).toHaveAttribute('aria-current', 'false');

      // Navigate to second story
      indicators[1].click();

      await waitFor(() => {
        expect(indicators[0]).toHaveAttribute('aria-current', 'false');
        expect(indicators[1]).toHaveAttribute('aria-current', 'true');
      });
    });

    it('should support keyboard navigation between indicators', async () => {
      render(<StoryScroller showNavigation={true} />);
      await waitForLenis();

      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      
      // Focus first indicator
      indicators[0].focus();
      expect(document.activeElement).toBe(indicators[0]);

      // Tab to next
      fireEvent.keyDown(indicators[0], { key: 'Tab' });
      
      // Note: Tab navigation is handled by browser, we just ensure structure is correct
      expect(indicators[1]).toHaveAttribute('tabindex', '0');
    });

    it('should update indicators on scroll', async () => {
      const { rerender } = render(<StoryScroller showNavigation={true} />);
      await waitForLenis();

      // Simulate scroll to second story
      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      scrollHandler?.({ scroll: 800, limit: 3840, progress: 0.21 });

      // Force re-render to update indicators
      rerender(<StoryScroller showNavigation={true} />);

      await waitFor(() => {
        const indicators = screen.getAllByRole('button', { name: /Go to story/i });
        expect(indicators[1]).toHaveAttribute('aria-current', 'true');
      });
    });
  });

  describe('navigation callbacks', () => {
    it('should call onNavigationStart', async () => {
      const onNavigationStart = vi.fn();
      
      render(
        <StoryScroller 
          showNavigation={true}
          onNavigationStart={onNavigationStart}
        />
      );
      await waitForLenis();

      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      indicators[1].click();

      await waitFor(() => {
        expect(onNavigationStart).toHaveBeenCalledWith('story-2', 1);
      });
    });

    it('should call onNavigationEnd', async () => {
      const onNavigationEnd = vi.fn();
      
      render(
        <StoryScroller 
          showNavigation={true}
          onNavigationEnd={onNavigationEnd}
        />
      );
      await waitForLenis();

      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      indicators[1].click();

      // Simulate navigation completion
      await vi.advanceTimersByTime(1200);

      await waitFor(() => {
        expect(onNavigationEnd).toHaveBeenCalledWith('story-2', 1);
      });
    });

    it('should handle navigation cancellation', async () => {
      const onNavigationStart = vi.fn();
      const onNavigationEnd = vi.fn();
      const onNavigationCancel = vi.fn();
      
      render(
        <StoryScroller 
          showNavigation={true}
          onNavigationStart={onNavigationStart}
          onNavigationEnd={onNavigationEnd}
          onNavigationCancel={onNavigationCancel}
        />
      );
      await waitForLenis();

      // Start navigation
      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      indicators[1].click();

      await waitFor(() => {
        expect(onNavigationStart).toHaveBeenCalled();
      });

      // Start another navigation before first completes
      indicators[2].click();

      await waitFor(() => {
        expect(onNavigationCancel).toHaveBeenCalledWith('story-2', 1);
        expect(onNavigationStart).toHaveBeenCalledWith('story-3', 2);
      });
    });
  });

  describe('auto-advance navigation', () => {
    it('should auto-advance to next story', async () => {
      render(
        <StoryScroller 
          enableAutoAdvance={true}
          autoAdvanceDelay={1000}
        />
      );
      await waitForLenis();

      // Wait for auto-advance
      await vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(
          768,
          expect.any(Object)
        );
      });
    });

    it('should pause auto-advance on user interaction', async () => {
      render(
        <StoryScroller 
          enableAutoAdvance={true}
          autoAdvanceDelay={1000}
        />
      );
      await waitForLenis();

      // User scrolls
      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      scrollHandler?.({ scroll: 100, limit: 3840, progress: 0.026, isScrolling: true });

      // Wait past auto-advance delay
      await vi.advanceTimersByTime(1500);

      // Should not auto-advance
      expect(mockLenis.scrollTo).not.toHaveBeenCalled();
    });

    it('should loop back to first story after last', async () => {
      render(
        <StoryScroller 
          enableAutoAdvance={true}
          autoAdvanceDelay={500}
          autoAdvanceLoop={true}
        />,
        { initialStoryId: 'story-5' }
      );
      await waitForLenis();

      // Wait for auto-advance
      await vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(
          0, // First story
          expect.any(Object)
        );
      });
    });

    it('should stop at last story when loop disabled', async () => {
      render(
        <StoryScroller 
          enableAutoAdvance={true}
          autoAdvanceDelay={500}
          autoAdvanceLoop={false}
        />,
        { initialStoryId: 'story-5' }
      );
      await waitForLenis();

      // Wait for auto-advance attempt
      await vi.advanceTimersByTime(500);

      // Should not navigate
      expect(mockLenis.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('navigation performance', () => {
    it('should batch multiple navigation requests', async () => {
      render(<StoryScroller showNavigation={true} />);
      await waitForLenis();

      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      
      // Click multiple indicators rapidly
      indicators[1].click();
      indicators[2].click();
      indicators[3].click();

      await vi.advanceTimersByTime(100);

      // Should only navigate to the last requested story
      expect(mockLenis.scrollTo).toHaveBeenCalledTimes(1);
      expect(mockLenis.scrollTo).toHaveBeenCalledWith(
        2304, // Fourth story position
        expect.any(Object)
      );
    });

    it('should handle rapid keyboard navigation', async () => {
      render(<StoryScroller enableKeyboardNavigation={true} />);
      await waitForLenis();

      // Rapidly press arrow keys
      await simulateKeyPress('ArrowDown');
      await simulateKeyPress('ArrowDown');
      await simulateKeyPress('ArrowDown');

      await vi.advanceTimersByTime(100);

      // Should batch navigation
      expect(mockLenis.scrollTo).toHaveBeenCalledTimes(1);
    });
  });
});