import React, { ReactElement } from 'react';
import { render, RenderOptions, act } from '@testing-library/react';
import { vi } from 'vitest';
import { StoryScrollerProvider } from '../../context/StoryScrollerContext';
import { ScrollProvider } from '../../context/ScrollContext';
import { mockRAF } from './mocks';
import type { Story } from '../../types';

// Default test stories
export const createTestStories = (count: number = 3): Story[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `story-${i + 1}`,
    content: `Test Story ${i + 1}`,
    backgroundColor: `#${((i + 1) * 111111).toString(16).padStart(6, '0')}`,
  }));
};

// Custom render function that includes providers
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  stories?: Story[];
  initialStoryId?: string;
}

export const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { stories = createTestStories(), initialStoryId, ...renderOptions } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ScrollProvider>
      <StoryScrollerProvider stories={stories} initialStoryId={initialStoryId}>
        {children}
      </StoryScrollerProvider>
    </ScrollProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Helper to wait for animations
export const waitForAnimation = async (duration: number = 100) => {
  await act(async () => {
    vi.advanceTimersByTime(duration);
    mockRAF.flush();
    await Promise.resolve();
  });
};

// Helper to simulate scroll
export const simulateScroll = async (scrollY: number) => {
  await act(async () => {
    window.scrollY = scrollY;
    window.pageYOffset = scrollY;
    window.dispatchEvent(new Event('scroll'));
    await Promise.resolve();
  });
};

// Helper to simulate resize
export const simulateResize = async (width: number, height: number) => {
  await act(async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
    await Promise.resolve();
  });
};

// Helper to simulate keyboard event
export const simulateKeyPress = async (key: string, element?: Element) => {
  const target = element || document.body;
  await act(async () => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    await Promise.resolve();
  });
};

// Helper to get computed styles
export const getComputedTransform = (element: HTMLElement): {
  translateY: number;
  scale: number;
  opacity: number;
} => {
  const style = element.style;
  const transform = style.transform || '';
  const opacity = parseFloat(style.opacity || '1');
  
  // Extract translateY
  const translateMatch = transform.match(/translateY\(([-\d.]+)px\)/);
  const translateY = translateMatch ? parseFloat(translateMatch[1]) : 0;
  
  // Extract scale
  const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
  const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
  
  return { translateY, scale, opacity };
};

// Helper to wait for Lenis initialization
export const waitForLenis = async () => {
  await act(async () => {
    await Promise.resolve();
    vi.runAllTimers();
    await Promise.resolve();
  });
};

// Helper to create a mock container with dimensions
export const createMockContainer = (
  width: number = 1024,
  height: number = 768
): HTMLDivElement => {
  const container = document.createElement('div');
  
  Object.defineProperties(container, {
    offsetWidth: { value: width, configurable: true },
    offsetHeight: { value: height, configurable: true },
    clientWidth: { value: width, configurable: true },
    clientHeight: { value: height, configurable: true },
    scrollHeight: { value: height * 3, configurable: true },
    getBoundingClientRect: {
      value: () => ({
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      configurable: true,
    },
  });
  
  return container;
};

// Helper to create story elements with proper dimensions
export const createStoryElements = (count: number = 3): HTMLElement[] => {
  return Array.from({ length: count }, (_, i) => {
    const element = document.createElement('div');
    element.setAttribute('data-story-id', `story-${i + 1}`);
    element.style.height = '100vh';
    
    Object.defineProperties(element, {
      offsetTop: { value: i * 768, configurable: true },
      offsetHeight: { value: 768, configurable: true },
      getBoundingClientRect: {
        value: () => ({
          top: i * 768 - window.scrollY,
          height: 768,
          bottom: (i + 1) * 768 - window.scrollY,
          left: 0,
          right: 1024,
          width: 1024,
          x: 0,
          y: i * 768 - window.scrollY,
          toJSON: () => ({}),
        }),
        configurable: true,
      },
    });
    
    return element;
  });
};

// Helper to setup document body for tests
export const setupTestDocument = () => {
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.height = '100vh';
  document.body.style.overflow = 'hidden';
};

// Helper to cleanup after tests
export const cleanupTestDocument = () => {
  document.body.style.cssText = '';
  document.body.innerHTML = '';
  window.scrollY = 0;
  window.pageYOffset = 0;
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };