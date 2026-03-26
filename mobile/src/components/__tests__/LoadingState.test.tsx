import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingState from '../LoadingState';

const mockLottieCalls: Array<Record<string, unknown>> = [];

jest.mock('lottie-react-native', () => {
  const { View } = require('react-native');

  return function MockLottieView(props: Record<string, unknown>) {
    mockLottieCalls.push(props);
    return <View testID="loading-animation" />;
  };
});

describe('LoadingState', () => {
  beforeEach(() => {
    mockLottieCalls.length = 0;
  });

  it('renders the loading animation with the expected playback settings', () => {
    const { getByTestId } = render(<LoadingState />);

    expect(getByTestId('loading-animation')).toBeTruthy();
    expect(mockLottieCalls).toHaveLength(1);
    expect(mockLottieCalls[0]).toEqual(
      expect.objectContaining({
        autoPlay: true,
        loop: true,
        source: expect.anything(),
        style: expect.objectContaining({
          width: 200,
          height: 200,
        }),
      }),
    );
  });
});
