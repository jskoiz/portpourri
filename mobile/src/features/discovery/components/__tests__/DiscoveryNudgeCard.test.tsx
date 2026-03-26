import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { DiscoveryNudgeCard } from '../DiscoveryNudgeCard';

describe('DiscoveryNudgeCard', () => {
  it('hides itself when the profile is already sufficiently complete', () => {
    const { queryByTestId } = render(<DiscoveryNudgeCard score={60} onPress={jest.fn()} />);

    expect(queryByTestId('discovery-nudge-card')).toBeNull();
  });

  it('shows the current completeness score and opens the profile prompt', () => {
    const onPress = jest.fn();
    const { getByTestId, getByText, getByLabelText } = render(
      <DiscoveryNudgeCard score={35} onPress={onPress} />,
    );

    expect(getByText('35%')).toBeTruthy();
    expect(getByLabelText('Complete your profile to get more matches')).toBeTruthy();

    fireEvent.press(getByTestId('discovery-nudge-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
