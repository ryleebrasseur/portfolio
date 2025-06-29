/**
 * @fileoverview Simplified StoryScroller component.
 * All logic has been moved to the useScrollManager hook.
 * This component is now a pure presentational wrapper.
 */

import React from 'react';
import { useScrollManager } from '../hooks/useScrollManager';
import type { StoryScrollerProps } from '../types';
import { CSS_CLASSES, DATA_ATTRIBUTES } from '../constants/scroll-physics';

/**
 * StoryScroller component creates a full-page section-snapping experience.
 * The useScrollManager hook contains ALL the logic for scroll management.
 */
export const StoryScroller: React.FC<StoryScrollerProps> = (props) => {
  const {
    sections,
    containerClassName = '',
    sectionClassName = '',
    className = '',
    style = {},
    ...scrollConfig
  } = props;

  // The useScrollManager hook now contains ALL the logic
  const { containerRef } = useScrollManager({
    sections,
    ...scrollConfig,
  });

  // Early return if sections not provided
  if (!sections || sections.length === 0) {
    console.error('StoryScroller: sections prop is required and must not be empty');
    return null;
  }

  // The component is now only responsible for rendering the UI
  return (
    <div
      ref={containerRef}
      className={`${CSS_CLASSES.CONTAINER} ${containerClassName} ${className}`.trim()}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        position: 'relative',
        ...style,
      }}
      {...{ [DATA_ATTRIBUTES.SCROLL_CONTAINER]: true }}
    >
      {sections.map((child, i) => (
        <section
          key={i}
          data-section-idx={i}
          {...{ [DATA_ATTRIBUTES.SECTION_INDEX]: i }}
          tabIndex={0}
          className={`${CSS_CLASSES.SECTION} ${sectionClassName}`.trim()}
          style={{
            height: '100vh',
            width: '100%',
            outline: 'none',
          }}
        >
          {child}
        </section>
      ))}
    </div>
  );
};