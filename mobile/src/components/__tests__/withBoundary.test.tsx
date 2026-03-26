import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { withBoundary } from '../withBoundary';

jest.mock('../../core/observability/sentry', () => ({
  captureException: jest.fn(),
  logDevOnly: jest.fn(),
}));

function Screen({ title }: { title: string }) {
  return <Text>{title}</Text>;
}

function ThrowingScreen(): never {
  throw new Error('Boundary failure');
}

describe('withBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('wraps the screen component and forwards props through', () => {
    const BoundedScreen = withBoundary(Screen, 'chat');

    expect(BoundedScreen.displayName).toBe('Bounded(chat)');

    const { getByText } = render(<BoundedScreen title="Chat content" />);

    expect(getByText('Chat content')).toBeTruthy();
  });

  it('surfaces crashes through the error boundary with the boundary name', () => {
    const { captureException } = require('../../core/observability/sentry');
    const BoundedScreen = withBoundary(ThrowingScreen, 'chat');

    const { getByText } = render(<BoundedScreen />);

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Boundary failure')).toBeTruthy();
    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: {
          source: 'error-boundary',
          boundary: 'chat',
        },
      }),
    );
  });
});
