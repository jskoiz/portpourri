import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AppButton from '../AppButton';

describe('AppButton', () => {
  it('renders the label and handles presses', () => {
    const onPress = jest.fn();
    const { getByText } = render(<AppButton label="Join BRDG" onPress={onPress} />);
    fireEvent.press(getByText('Join BRDG'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders loading state without crashing', () => {
    const { toJSON } = render(<AppButton label="Loading" onPress={() => undefined} loading />);
    expect(toJSON()).toBeTruthy();
  });
});

