import type { ReactNode } from 'react'

/**
 * Represents a section in the StoryScroller.
 * Each section is expected to be a ReactNode (e.g., a JSX element).
 */
export type StorySection = ReactNode

/**
 * Configuration options for the StoryScroller component.
 */
export interface StoryScrollerConfig {
  /**
   * Duration of the smooth scroll animation in seconds.
   * @default 1.2
   */
  duration?: number
  
  /**
   * Easing function for scroll animations.
   * @default (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
   */
  easing?: (t: number) => number
  
  /**
   * Tolerance for GSAP Observer to prevent accidental triggers.
   * Higher values are better for trackpads.
   * @default 50
   */
  tolerance?: number
  
  /**
   * Whether to enable smooth scrolling on touch devices.
   * @default false
   */
  smoothTouch?: boolean
  
  /**
   * Multiplier for touch scroll speed.
   * @default 2
   */
  touchMultiplier?: number
  
  /**
   * Whether to prevent default scroll behavior.
   * @default true
   */
  preventDefault?: boolean
  
  /**
   * Whether to invert scroll direction.
   * @default false
   */
  invertDirection?: boolean
  
  /**
   * Callback fired when section changes.
   */
  onSectionChange?: (index: number) => void
  
  /**
   * Whether to use keyboard navigation (arrow keys).
   * @default true
   */
  keyboardNavigation?: boolean
  
  /**
   * CSS class name for the container.
   */
  containerClassName?: string
  
  /**
   * CSS class name for sections.
   */
  sectionClassName?: string
}

/**
 * Props for the StoryScroller component.
 */
export interface StoryScrollerProps extends StoryScrollerConfig {
  /**
   * An array of React nodes, where each node represents a full-viewport section.
   * The component will snap between these sections.
   * @example
   * ```tsx
   * <StoryScroller sections={[<div>Section 1</div>, <div>Section 2</div>]} />
   * ```
   */
  sections: StorySection[]
  
  /**
   * Optional CSS class name for the container element.
   */
  className?: string
  
  /**
   * Optional inline styles for the container element.
   */
  style?: React.CSSProperties
}

