import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoryScroller } from '../../hooks/useStoryScroller.test';
import { StoryScrollerProvider } from '../../context/StoryScrollerContext';
import { createTestStories } from '../setup/test-utils';
import type { Story } from '../../types';

describe('useStoryScroller', () => {
  const stories = createTestStories(3);
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <StoryScrollerProvider stories={stories}>
      {children}
    </StoryScrollerProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useStoryScroller());
      }).toThrow('useStoryScroller must be used within a StoryScrollerProvider');
      
      consoleSpy.mockRestore();
    });

    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      expect(result.current.stories).toEqual(stories);
      expect(result.current.currentStoryId).toBe('story-1');
      expect(result.current.currentStoryIndex).toBe(0);
      expect(result.current.isNavigating).toBe(false);
      expect(result.current.scrollProgress).toBe(0);
      expect(result.current.isAutoScrollEnabled).toBe(true);
    });

    it('should initialize with custom initial story', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryScrollerProvider stories={stories} initialStoryId="story-2">
          {children}
        </StoryScrollerProvider>
      );

      const { result } = renderHook(() => useStoryScroller(), { wrapper: customWrapper });

      expect(result.current.currentStoryId).toBe('story-2');
      expect(result.current.currentStoryIndex).toBe(1);
    });
  });

  describe('navigation methods', () => {
    it('should navigate to next story', async () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      await act(async () => {
        await result.current.navigateToNext();
      });

      expect(result.current.currentStoryId).toBe('story-2');
      expect(result.current.currentStoryIndex).toBe(1);
    });

    it('should navigate to previous story', async () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryScrollerProvider stories={stories} initialStoryId="story-2">
          {children}
        </StoryScrollerProvider>
      );

      const { result } = renderHook(() => useStoryScroller(), { wrapper: customWrapper });

      await act(async () => {
        await result.current.navigateToPrevious();
      });

      expect(result.current.currentStoryId).toBe('story-1');
      expect(result.current.currentStoryIndex).toBe(0);
    });

    it('should navigate to specific story by id', async () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      await act(async () => {
        await result.current.navigateToStory('story-3');
      });

      expect(result.current.currentStoryId).toBe('story-3');
      expect(result.current.currentStoryIndex).toBe(2);
    });

    it('should navigate to story by index', async () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      await act(async () => {
        await result.current.navigateToIndex(2);
      });

      expect(result.current.currentStoryId).toBe('story-3');
      expect(result.current.currentStoryIndex).toBe(2);
    });

    it('should not navigate past last story', async () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      // Navigate to last story
      await act(async () => {
        await result.current.navigateToIndex(2);
      });

      // Try to navigate further
      await act(async () => {
        await result.current.navigateToNext();
      });

      expect(result.current.currentStoryIndex).toBe(2);
    });

    it('should not navigate before first story', async () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      await act(async () => {
        await result.current.navigateToPrevious();
      });

      expect(result.current.currentStoryIndex).toBe(0);
    });

    it('should handle invalid story id gracefully', async () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await act(async () => {
        await result.current.navigateToStory('invalid-id');
      });

      expect(result.current.currentStoryId).toBe('story-1'); // Should remain unchanged
      expect(consoleSpy).toHaveBeenCalledWith('Story with id "invalid-id" not found');
      
      consoleSpy.mockRestore();
    });

    it('should handle invalid index gracefully', async () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await act(async () => {
        await result.current.navigateToIndex(10);
      });

      expect(result.current.currentStoryIndex).toBe(0); // Should remain unchanged
      expect(consoleSpy).toHaveBeenCalledWith('Invalid story index: 10');
      
      consoleSpy.mockRestore();
    });
  });

  describe('auto-scroll functionality', () => {
    it('should toggle auto-scroll', () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      expect(result.current.isAutoScrollEnabled).toBe(true);

      act(() => {
        result.current.setAutoScrollEnabled(false);
      });

      expect(result.current.isAutoScrollEnabled).toBe(false);

      act(() => {
        result.current.setAutoScrollEnabled(true);
      });

      expect(result.current.isAutoScrollEnabled).toBe(true);
    });
  });

  describe('navigation state', () => {
    it('should set isNavigating during navigation', async () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      const navigationPromise = act(async () => {
        const promise = result.current.navigateToNext();
        // Check state immediately after calling navigate
        expect(result.current.isNavigating).toBe(true);
        await promise;
      });

      await navigationPromise;
      expect(result.current.isNavigating).toBe(false);
    });

    it('should prevent concurrent navigation', async () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await act(async () => {
        // Start first navigation
        const firstNav = result.current.navigateToNext();
        
        // Try second navigation while first is in progress
        const secondNav = result.current.navigateToNext();
        
        await Promise.all([firstNav, secondNav]);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Navigation already in progress');
      expect(result.current.currentStoryIndex).toBe(1); // Should only move once
      
      consoleSpy.mockRestore();
    });
  });

  describe('scroll progress', () => {
    it('should update scroll progress', () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      act(() => {
        result.current.setScrollProgress(0.5);
      });

      expect(result.current.scrollProgress).toBe(0.5);

      act(() => {
        result.current.setScrollProgress(1);
      });

      expect(result.current.scrollProgress).toBe(1);
    });

    it('should clamp scroll progress between 0 and 1', () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      act(() => {
        result.current.setScrollProgress(-0.5);
      });

      expect(result.current.scrollProgress).toBe(0);

      act(() => {
        result.current.setScrollProgress(1.5);
      });

      expect(result.current.scrollProgress).toBe(1);
    });
  });

  describe('story management', () => {
    it('should handle empty stories array', () => {
      const emptyWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryScrollerProvider stories={[]}>
          {children}
        </StoryScrollerProvider>
      );

      const { result } = renderHook(() => useStoryScroller(), { wrapper: emptyWrapper });

      expect(result.current.stories).toEqual([]);
      expect(result.current.currentStoryId).toBeNull();
      expect(result.current.currentStoryIndex).toBe(-1);
    });

    it('should update when stories change', () => {
      const { result, rerender } = renderHook(() => useStoryScroller(), { wrapper });

      expect(result.current.stories).toHaveLength(3);

      const newStories = createTestStories(5);
      const newWrapper = ({ children }: { children: React.ReactNode }) => (
        <StoryScrollerProvider stories={newStories}>
          {children}
        </StoryScrollerProvider>
      );

      rerender({ wrapper: newWrapper });

      expect(result.current.stories).toHaveLength(5);
    });
  });

  describe('computed properties', () => {
    it('should correctly compute hasNext', () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      expect(result.current.hasNext).toBe(true);

      act(() => {
        result.current.navigateToIndex(2);
      });

      expect(result.current.hasNext).toBe(false);
    });

    it('should correctly compute hasPrevious', () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      expect(result.current.hasPrevious).toBe(false);

      act(() => {
        result.current.navigateToIndex(1);
      });

      expect(result.current.hasPrevious).toBe(true);
    });

    it('should return correct current story', () => {
      const { result } = renderHook(() => useStoryScroller(), { wrapper });

      expect(result.current.currentStory).toEqual(stories[0]);

      act(() => {
        result.current.navigateToIndex(1);
      });

      expect(result.current.currentStory).toEqual(stories[1]);
    });
  });
});