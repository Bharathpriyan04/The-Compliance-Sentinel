import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Mock console.error to suppress expected error output
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock postMessage
window.parent.postMessage = vi.fn();

describe('ErrorBoundary', () => {
  afterEach(() => {
    mockConsoleError.mockClear();
    vi.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Child</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('renders error UI when child throws', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/This app hit a snag/)).toBeInTheDocument();
    expect(screen.getByText(/Reload preview/)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('sets openswarm error flags when error occurs', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(window.__openswarm_render_failed).toBe(true);
    expect(window.__openswarm_rendered).toBe(false);
    expect(window.__openswarm_last_error).toContain('Test error');
  });

  it('calls postMessage to parent when error occurs', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(window.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'openswarm:app-error',
        message: 'Test error',
      }),
      '*'
    );
  });

  it('renders component stack in error UI', () => {
    const ChildComponent = () => {
      throw new Error('Stack test');
    };

    render(
      <ErrorBoundary>
        <ChildComponent />
      </ErrorBoundary>
    );

    // The component stack should be rendered
    expect(screen.getByText(/ChildComponent/)).toBeInTheDocument();
  });
});
