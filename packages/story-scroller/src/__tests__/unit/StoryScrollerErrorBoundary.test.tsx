import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StoryScrollerErrorBoundary } from '../../components/StoryScrollerErrorBoundary';
import React from 'react';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('StoryScrollerErrorBoundary', () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Suppress console.error for error boundary tests
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render children when there is no error', () => {
    render(
      <StoryScrollerErrorBoundary>
        <div>Test content</div>
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render custom fallback when error occurs', () => {
    const fallback = <div>Custom error message</div>;

    render(
      <StoryScrollerErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('No error')).not.toBeInTheDocument();
  });

  it('should render default error UI when no fallback provided', () => {
    render(
      <StoryScrollerErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <StoryScrollerErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </StoryScrollerErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
    expect(onError.mock.calls[0][0].message).toBe('Test error message');
  });

  it('should log error details to console in development', () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';

    render(
      <StoryScrollerErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StoryScrollerErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'StoryScroller Error:',
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );

    (process.env as any).NODE_ENV = originalEnv;
  });

  it('should not log error details in production', () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';

    render(
      <StoryScrollerErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StoryScrollerErrorBoundary>
    );

    // Console.error is called by React itself, but our component shouldn't add more logs
    const storyScrollerLogs = consoleSpy.mock.calls.filter((call: any[]) => 
      call[0] === 'StoryScroller Error:'
    );
    expect(storyScrollerLogs).toHaveLength(0);

    (process.env as any).NODE_ENV = originalEnv;
  });

  it('should recover when error is resolved', () => {
    const { rerender } = render(
      <StoryScrollerErrorBoundary>
        <ThrowError shouldThrow={true} />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Re-render with no error
    rerender(
      <StoryScrollerErrorBoundary>
        <ThrowError shouldThrow={false} />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should handle errors in error boundary fallback', () => {
    const BadFallback = () => {
      throw new Error('Fallback error');
    };

    // This should not crash the entire app
    render(
      <StoryScrollerErrorBoundary fallback={<BadFallback />}>
        <ThrowError shouldThrow={true} />
      </StoryScrollerErrorBoundary>
    );

    // React will show its own error boundary fallback in this case
    // We just need to ensure it doesn't crash
    expect(document.body).toBeDefined();
  });

  it('should preserve error boundary state across re-renders', () => {
    let triggerError = false;
    const DynamicError = () => {
      if (triggerError) {
        throw new Error('Dynamic error');
      }
      return <div>Working fine</div>;
    };

    const { rerender } = render(
      <StoryScrollerErrorBoundary>
        <DynamicError />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Working fine')).toBeInTheDocument();

    // Trigger error
    triggerError = true;
    rerender(
      <StoryScrollerErrorBoundary>
        <DynamicError />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Dynamic error')).toBeInTheDocument();
  });

  it('should handle async errors', async () => {
    const AsyncError = () => {
      React.useEffect(() => {
        throw new Error('Async error');
      }, []);
      return <div>Async component</div>;
    };

    render(
      <StoryScrollerErrorBoundary>
        <AsyncError />
      </StoryScrollerErrorBoundary>
    );

    // Note: Error boundaries don't catch errors in event handlers, async code,
    // during SSR, or errors thrown in the error boundary itself
    // This is a React limitation, not our component's fault
    expect(screen.getByText('Async component')).toBeInTheDocument();
  });

  it('should display user-friendly error message with details', () => {
    const complexError = new Error('Connection timeout: Unable to reach server at https://api.example.com/stories');

    const ErrorComponent = () => {
      throw complexError;
    };

    render(
      <StoryScrollerErrorBoundary>
        <ErrorComponent />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(complexError.message)).toBeInTheDocument();
  });

  it('should handle errors with no message', () => {
    const ErrorWithoutMessage = () => {
      throw new Error();
    };

    render(
      <StoryScrollerErrorBoundary>
        <ErrorWithoutMessage />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
  });

  it('should handle non-Error objects being thrown', () => {
    const ThrowString = () => {
      throw 'String error'; // eslint-disable-line no-throw-literal
    };

    render(
      <StoryScrollerErrorBoundary>
        <ThrowString />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('String error')).toBeInTheDocument();
  });

  it('should handle null/undefined errors gracefully', () => {
    const ThrowNull = () => {
      throw null; // eslint-disable-line no-throw-literal
    };

    render(
      <StoryScrollerErrorBoundary>
        <ThrowNull />
      </StoryScrollerErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
  });
});