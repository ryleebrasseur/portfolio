import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoryScrollerErrorBoundary } from '../../components/StoryScrollerErrorBoundary';
import React from 'react';

// Simple test to verify error boundary works
const ThrowError = () => {
  throw new Error('Test error');
};

describe('Simple Tests', () => {
  it('should render children when no error', () => {
    render(
      <StoryScrollerErrorBoundary>
        <div>Test content</div>
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should catch errors and show fallback', () => {
    // Suppress console errors for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <StoryScrollerErrorBoundary>
        <ThrowError />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});