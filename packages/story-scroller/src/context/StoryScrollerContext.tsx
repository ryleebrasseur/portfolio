import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import type { Story } from '../types';

interface StoryScrollerContextValue {
  stories: Story[];
  currentStoryId: string | null;
  currentStoryIndex: number;
  isNavigating: boolean;
  scrollProgress: number;
  isAutoScrollEnabled: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  currentStory: Story | undefined;
  navigateToNext: () => Promise<void>;
  navigateToPrevious: () => Promise<void>;
  navigateToStory: (storyId: string) => Promise<void>;
  navigateToIndex: (index: number) => Promise<void>;
  setAutoScrollEnabled: (enabled: boolean) => void;
  setScrollProgress: (progress: number) => void;
  setCurrentStoryId: (storyId: string) => void;
  setIsNavigating: (navigating: boolean) => void;
}

const StoryScrollerContext = createContext<StoryScrollerContextValue | null>(null);

export interface StoryScrollerProviderProps {
  stories: Story[];
  initialStoryId?: string;
  children: ReactNode;
}

export function StoryScrollerProvider({ 
  stories, 
  initialStoryId,
  children 
}: StoryScrollerProviderProps) {
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(
    initialStoryId || (stories.length > 0 ? stories[0].id : null)
  );
  const [isNavigating, setIsNavigating] = useState(false);
  const [scrollProgress, setScrollProgressState] = useState(0);
  const [isAutoScrollEnabled, setAutoScrollEnabled] = useState(true);
  
  const navigationPromiseRef = useRef<Promise<void> | null>(null);

  const currentStoryIndex = stories.findIndex(story => story.id === currentStoryId);
  const hasNext = currentStoryIndex < stories.length - 1;
  const hasPrevious = currentStoryIndex > 0;
  const currentStory = stories[currentStoryIndex];

  const setScrollProgress = useCallback((progress: number) => {
    setScrollProgressState(Math.max(0, Math.min(1, progress)));
  }, []);

  const navigateToIndex = useCallback(async (index: number): Promise<void> => {
    if (isNavigating) {
      console.warn('Navigation already in progress');
      return;
    }

    if (index < 0 || index >= stories.length) {
      console.warn(`Invalid story index: ${index}`);
      return;
    }

    setIsNavigating(true);
    const targetStory = stories[index];
    
    try {
      // In real implementation, this would trigger scroll
      // For tests, we just update state
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentStoryId(targetStory.id);
    } finally {
      setIsNavigating(false);
    }
  }, [stories, isNavigating]);

  const navigateToStory = useCallback(async (storyId: string): Promise<void> => {
    const index = stories.findIndex(story => story.id === storyId);
    if (index === -1) {
      console.warn(`Story with id "${storyId}" not found`);
      return;
    }
    return navigateToIndex(index);
  }, [stories, navigateToIndex]);

  const navigateToNext = useCallback(async (): Promise<void> => {
    if (hasNext) {
      return navigateToIndex(currentStoryIndex + 1);
    }
  }, [currentStoryIndex, hasNext, navigateToIndex]);

  const navigateToPrevious = useCallback(async (): Promise<void> => {
    if (hasPrevious) {
      return navigateToIndex(currentStoryIndex - 1);
    }
  }, [currentStoryIndex, hasPrevious, navigateToIndex]);

  const value: StoryScrollerContextValue = {
    stories,
    currentStoryId,
    currentStoryIndex,
    isNavigating,
    scrollProgress,
    isAutoScrollEnabled,
    hasNext,
    hasPrevious,
    currentStory,
    navigateToNext,
    navigateToPrevious,
    navigateToStory,
    navigateToIndex,
    setAutoScrollEnabled,
    setScrollProgress,
    setCurrentStoryId,
    setIsNavigating,
  };

  return (
    <StoryScrollerContext.Provider value={value}>
      {children}
    </StoryScrollerContext.Provider>
  );
}

export function useStoryScrollerContext() {
  const context = useContext(StoryScrollerContext);
  if (!context) {
    throw new Error('useStoryScroller must be used within a StoryScrollerProvider');
  }
  return context;
}