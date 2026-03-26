import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import RetryableError from '../ui/RetryableError';
import type { NormalizedApiError } from '../../api/errors';

jest.mock('@expo/vector-icons', () => ({
  Feather: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text accessibilityLabel={name}>{name}</Text>;
  },
}));

function makeError(overrides: Partial<NormalizedApiError> = {}): NormalizedApiError {
  return {
    message: 'Too many requests',
    kind: 'rate_limited',
    isNetworkError: false,
    isUnauthorized: false,
    retryable: true,
    ...overrides,
  };
}

describe('RetryableError', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down before allowing a retry when retryAfterSeconds is set', () => {
    const onRetry = jest.fn();

    const { getByLabelText, getByText, queryByText } = render(
      <RetryableError
        error={makeError({ retryAfterSeconds: 2 })}
        onRetry={onRetry}
      />,
    );

    expect(getByText('Retry available in 2s')).toBeTruthy();
    expect(getByLabelText('Retry').props.accessibilityState).toEqual(
      expect.objectContaining({
        disabled: true,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(getByText('Retry available in 1s')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(queryByText(/Retry available in/)).toBeNull();
    expect(getByLabelText('Retry').props.accessibilityState).toEqual(
      expect.objectContaining({
        disabled: false,
      }),
    );

    fireEvent.press(getByLabelText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides the retry action when hideRetry is true', () => {
    const { queryByLabelText, queryByText, getByText } = render(
      <RetryableError error={makeError({ retryable: false })} onRetry={jest.fn()} hideRetry />,
    );

    expect(getByText('Too many requests')).toBeTruthy();
    expect(queryByLabelText('Retry')).toBeNull();
    expect(queryByText('Try again')).toBeNull();
  });
});
