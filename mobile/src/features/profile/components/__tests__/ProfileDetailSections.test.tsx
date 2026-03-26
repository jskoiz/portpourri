import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { lightTheme } from '../../../../theme/tokens';
import { ProfileDetailHero, ProfileDetailInfo } from '../ProfileDetailSections';

const mockLightTheme = lightTheme;

jest.mock('expo-image', () => ({
  Image: ({ accessibilityLabel }: { accessibilityLabel?: string }) => {
    const { View } = require('react-native');
    return <View accessibilityLabel={accessibilityLabel} />;
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('../../../../theme/useTheme', () => ({
  useTheme: () => mockLightTheme,
}));

describe('ProfileDetailSections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile detail content and movement identity labels', () => {
    render(
      <ProfileDetailInfo
        activityTags={['Lifting', 'Running', 'Swimming']}
        bio="Always training for the next sunrise session."
        disabled={false}
        onSuggestActivity={jest.fn()}
        structuredRows={[
          { label: 'Training style', value: 'Balanced' },
          { label: 'Weekly rhythm', value: '3-4 sessions' },
        ]}
        weeklyFrequencyBand="3-4"
      />,
    );

    expect(screen.getByText('About')).toBeTruthy();
    expect(screen.getByText('Always training for the next sunrise session.')).toBeTruthy();
    expect(screen.getByText('Moves 3-4x per week.')).toBeTruthy();
    expect(screen.getByLabelText('Training style: Balanced')).toBeTruthy();
    expect(screen.getByLabelText('Weekly rhythm: 3-4 sessions')).toBeTruthy();
    expect(screen.getByLabelText('Movement identity: Lifting, Running, Swimming')).toBeTruthy();
    expect(screen.getByLabelText('Suggest an activity')).toBeTruthy();
  });

  it('opens the overflow menu and forwards the report action', () => {
    const onBack = jest.fn();
    const onBlock = jest.fn();
    const onReport = jest.fn();

    render(
      <ProfileDetailHero
        activityTags={['Lifting', 'Running']}
        age={29}
        city="Honolulu"
        firstName="Kai"
        intentDisplay="Training Partner"
        onBack={onBack}
        onBlock={onBlock}
        onReport={onReport}
        photoUri={null}
      />,
    );

    const menuButton = screen.UNSAFE_getByProps({ accessibilityLabel: 'More options' });
    fireEvent.press(menuButton);
    expect(screen.UNSAFE_getByProps({ accessibilityLabel: 'More options' }).props.accessibilityState).toEqual(
      expect.objectContaining({ expanded: true }),
    );
    fireEvent.press(screen.getByText('Report'));

    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onBlock).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });
});
