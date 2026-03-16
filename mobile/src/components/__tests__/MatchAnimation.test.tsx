import React from 'react';
import { render } from '@testing-library/react-native';
import MatchAnimation from '../MatchAnimation';

jest.mock('lottie-react-native', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return function MockLottieView({
    onAnimationFinish,
  }: {
    onAnimationFinish?: () => void;
  }) {
    React.useEffect(() => {
      if (onAnimationFinish) {
        const timer = setTimeout(onAnimationFinish, 10);
        return () => clearTimeout(timer);
      }
    }, [onAnimationFinish]);
    return (
      <View>
        <Text>LottieAnimation</Text>
      </View>
    );
  };
});

describe('MatchAnimation', () => {
  it('renders nothing when not visible', () => {
    const { queryByText } = render(
      <MatchAnimation visible={false} onFinish={jest.fn()} />,
    );

    expect(queryByText("It's a Match!")).toBeNull();
  });

  it('renders the match text when visible', () => {
    const { getByText } = render(
      <MatchAnimation visible={true} onFinish={jest.fn()} />,
    );

    expect(getByText("It's a Match!")).toBeTruthy();
  });

  it('renders the Lottie animation when visible', () => {
    const { getByText } = render(
      <MatchAnimation visible={true} onFinish={jest.fn()} />,
    );

    expect(getByText('LottieAnimation')).toBeTruthy();
  });

  it('calls onFinish when animation completes', async () => {
    const onFinish = jest.fn();

    render(<MatchAnimation visible={true} onFinish={onFinish} />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(onFinish).toHaveBeenCalled();
  });
});
