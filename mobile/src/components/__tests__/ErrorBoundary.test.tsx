import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

jest.mock('../../core/observability/sentry', () => ({
  captureException: jest.fn(),
  logDevOnly: jest.fn(),
}));

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test explosion');
  }
  return <Text>Child content</Text>;
}

describe('ErrorBoundary', () => {
  // The jest.setup.js wraps console.error to throw on unexpected calls.
  // Error boundaries always trigger console.error, so we allow those calls.
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(getByText('Child content')).toBeTruthy();
  });

  it('shows default fallback when a child throws', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Test explosion')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('shows custom fallback when provided', () => {
    const fallback = <Text>Custom fallback</Text>;

    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={fallback}>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(getByText('Custom fallback')).toBeTruthy();
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('resets error state when Try Again is pressed', () => {
    let shouldThrow = true;

    function ControlledChild() {
      if (shouldThrow) {
        throw new Error('Temporary error');
      }
      return <Text>Recovered content</Text>;
    }

    const { getByText } = render(
      <ErrorBoundary>
        <ControlledChild />
      </ErrorBoundary>,
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    // Fix the error before retrying
    shouldThrow = false;

    fireEvent.press(getByText('Try Again'));

    expect(getByText('Recovered content')).toBeTruthy();
  });

  it('reports errors to Sentry', () => {
    const { captureException } = require('../../core/observability/sentry');

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { source: 'error-boundary' },
      }),
    );
  });
});
