import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { StoryScroller } from '../../components/StoryScroller';
import { 
  render, 
  createTestStories, 
  waitForLenis,
  createMockContainer,
  setupTestDocument,
  cleanupTestDocument,
} from '../setup/test-utils';
import { mockLenis, mockGsap, mockRAF } from '../setup/mocks';
import type { Story } from '../../types';

describe('StoryScroller Integration', () => {
  const stories = createTestStories(3);

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

  describe('component rendering', () => {
    it('should render all stories', () => {
      render(<StoryScroller />);

      stories.forEach((story, index) => {
        expect(screen.getByText(story.content)).toBeInTheDocument();
        expect(screen.getByTestId(`story-${story.id}`)).toBeInTheDocument();
      });
    });

    it('should apply correct styles to stories', () => {
      render(<StoryScroller />);

      stories.forEach((story) => {
        const element = screen.getByTestId(`story-${story.id}`);
        expect(element).toHaveStyle({
          backgroundColor: story.backgroundColor,
          height: '100vh',
        });
      });
    });

    it('should render with custom className', () => {
      const { container } = render(<StoryScroller className="custom-scroller" />);
      
      const scrollerElement = container.querySelector('.StoryScroller');
      expect(scrollerElement).toHaveClass('custom-scroller');
    });

    it('should render navigation indicators', () => {
      render(<StoryScroller showNavigation={true} />);

      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      expect(indicators).toHaveLength(stories.length);
    });

    it('should not render navigation when disabled', () => {
      render(<StoryScroller showNavigation={false} />);

      const indicators = screen.queryAllByRole('button', { name: /Go to story/i });
      expect(indicators).toHaveLength(0);
    });
  });

  describe('Lenis initialization', () => {
    it('should initialize Lenis with correct options', async () => {
      const LenisMock = vi.mocked((await import('lenis')).default);
      
      render(<StoryScroller />);
      await waitForLenis();

      expect(LenisMock).toHaveBeenCalledWith({
        duration: 1.2,
        easing: expect.any(Function),
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      });
    });

    it('should apply custom scroll options', async () => {
      const LenisMock = vi.mocked((await import('lenis')).default);
      const customOptions = {
        duration: 2,
        smoothWheel: false,
        wheelMultiplier: 0.5,
      };

      render(<StoryScroller scrollOptions={customOptions} />);
      await waitForLenis();

      expect(LenisMock).toHaveBeenCalledWith(
        expect.objectContaining(customOptions)
      );
    });

    it('should setup GSAP ticker integration', async () => {
      render(<StoryScroller />);
      await waitForLenis();

      expect(mockGsap.ticker.add).toHaveBeenCalled();
      expect(mockGsap.ticker.lagSmoothing).toHaveBeenCalledWith(0);
    });
  });

  describe('lifecycle management', () => {
    it('should start Lenis on mount', async () => {
      render(<StoryScroller />);
      await waitForLenis();

      const lenisInstance = mockLenis;
      expect(lenisInstance.start).toHaveBeenCalled();
    });

    it('should cleanup on unmount', async () => {
      const { unmount } = render(<StoryScroller />);
      await waitForLenis();

      const lenisInstance = mockLenis;
      vi.clearAllMocks();

      unmount();

      expect(lenisInstance.destroy).toHaveBeenCalled();
      expect(mockGsap.ticker.remove).toHaveBeenCalled();
    });

    it('should handle resize events', async () => {
      const { container } = render(<StoryScroller />);
      await waitForLenis();

      const lenisInstance = mockLenis;
      vi.clearAllMocks();

      // Simulate resize
      window.dispatchEvent(new Event('resize'));
      await waitFor(() => {
        expect(lenisInstance.resize).toHaveBeenCalled();
      });
    });
  });

  describe('scroll handling', () => {
    it('should update scroll progress', async () => {
      const onScrollProgress = vi.fn();
      render(<StoryScroller onScrollProgress={onScrollProgress} />);
      await waitForLenis();

      // Simulate scroll event from Lenis
      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      scrollHandler?.({ scroll: 500, limit: 1000, progress: 0.5 });

      expect(onScrollProgress).toHaveBeenCalledWith(0.5);
    });

    it('should handle story change on scroll', async () => {
      const onStoryChange = vi.fn();
      render(<StoryScroller onStoryChange={onStoryChange} />);
      await waitForLenis();

      // Mock scroll calculations
      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Scroll to second story
      scrollHandler?.({ scroll: 800, limit: 2400, progress: 0.33 });

      await waitFor(() => {
        expect(onStoryChange).toHaveBeenCalledWith('story-2', 1);
      });
    });
  });

  describe('scroll snap behavior', () => {
    it('should snap to nearest story when enabled', async () => {
      render(<StoryScroller enableScrollSnap={true} />);
      await waitForLenis();

      // Simulate scroll ending
      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      scrollHandler?.({ 
        scroll: 400, // Halfway between first and second story
        limit: 2400,
        progress: 0.17,
 
      });

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(768, expect.any(Object));
      });
    });

    it('should not snap when disabled', async () => {
      render(<StoryScroller enableScrollSnap={false} />);
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      scrollHandler?.({ 
        scroll: 400,
        limit: 2400,
        progress: 0.17,
 
      });

      await vi.advanceTimersByTime(200);
      expect(mockLenis.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('programmatic navigation', () => {
    it('should scroll to story when navigation indicator clicked', async () => {
      render(<StoryScroller showNavigation={true} />);
      await waitForLenis();

      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      indicators[2].click();

      await waitFor(() => {
        expect(mockLenis.scrollTo).toHaveBeenCalledWith(
          1536, // Third story position
          expect.objectContaining({ duration: 1.2 })
        );
      });
    });

    it('should update current story after navigation', async () => {
      const onStoryChange = vi.fn();
      render(<StoryScroller showNavigation={true} onStoryChange={onStoryChange} />);
      await waitForLenis();

      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      indicators[1].click();

      await waitFor(() => {
        expect(onStoryChange).toHaveBeenCalledWith('story-2', 1);
      });
    });
  });

  describe('performance', () => {
    it('should throttle scroll events', async () => {
      const onScrollProgress = vi.fn();
      render(<StoryScroller onScrollProgress={onScrollProgress} />);
      await waitForLenis();

      const scrollHandler = mockLenis.on.mock.calls.find(
        call => call[0] === 'scroll'
      )?.[1];

      // Simulate rapid scroll events
      for (let i = 0; i < 10; i++) {
        scrollHandler?.({ scroll: i * 10, limit: 1000, progress: i * 0.01 });
      }

      // Should not call onScrollProgress for every event
      expect(onScrollProgress.mock.calls.length).toBeLessThan(10);
    });

    it('should debounce resize handling', async () => {
      render(<StoryScroller />);
      await waitForLenis();

      vi.clearAllMocks();

      // Simulate multiple rapid resize events
      for (let i = 0; i < 5; i++) {
        window.dispatchEvent(new Event('resize'));
        await vi.advanceTimersByTime(50);
      }

      await vi.advanceTimersByTime(300);

      // Should only call resize once after debounce
      expect(mockLenis.resize).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle Lenis initialization failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const LenisMock = vi.mocked((await import('lenis')).default);
      LenisMock.mockImplementationOnce(() => {
        throw new Error('Lenis init failed');
      });

      render(<StoryScroller />);
      await waitForLenis();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize smooth scrolling:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle missing story elements gracefully', async () => {
      // Render without proper story elements
      const { container } = render(<StoryScroller />);
      
      // Remove story elements
      container.querySelectorAll('[data-story-id]').forEach(el => el.remove());

      await waitForLenis();

      // Should not crash
      expect(container.querySelector('.StoryScroller')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should maintain focus management during navigation', async () => {
      render(<StoryScroller showNavigation={true} />);
      await waitForLenis();

      const indicators = screen.getAllByRole('button', { name: /Go to story/i });
      indicators[1].focus();
      indicators[1].click();

      await waitFor(() => {
        expect(document.activeElement).toBe(indicators[1]);
      });
    });

    it('should announce story changes to screen readers', async () => {
      render(<StoryScroller />);
      await waitForLenis();

      const liveRegion = screen.getByRole('status', { hidden: true });
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent('Viewing story 1 of 3');
    });
  });

  describe('custom story rendering', () => {
    it('should render custom story components', () => {
      const customStories: Story[] = [
        {
          id: 'custom-1',
          content: <div data-testid="custom-content">Custom Story</div>,
          backgroundColor: '#ff0000',
        },
      ];

      render(<StoryScroller />, { stories: customStories });

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Story')).toBeInTheDocument();
    });

    it('should handle mixed content types', () => {
      const mixedStories: Story[] = [
        { id: '1', content: 'Text content', backgroundColor: '#000' },
        { id: '2', content: <div>React element</div>, backgroundColor: '#fff' },
        { 
          id: '3', 
          content: <img src="test.jpg" alt="Test" />, 
          backgroundColor: '#ccc' 
        },
      ];

      render(<StoryScroller />, { stories: mixedStories });

      expect(screen.getByText('Text content')).toBeInTheDocument();
      expect(screen.getByText('React element')).toBeInTheDocument();
      expect(screen.getByAltText('Test')).toBeInTheDocument();
    });
  });
});