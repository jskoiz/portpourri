import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../OnboardingScreen';

const mockUpdateFitness = jest.fn();
const mockUpdateProfile = jest.fn();
const mockSetUser = jest.fn();

jest.mock('../../features/profile/hooks/useProfile', () => ({
  useProfile: () => ({
    updateFitness: mockUpdateFitness,
    updateProfile: mockUpdateProfile,
    uploadPhoto: jest.fn(),
    updatePhoto: jest.fn(),
    deletePhoto: jest.fn(),
    profile: null,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../store/authStore', () => ({
  useAuthStore: (
    selector: (state: {
      setUser: typeof mockSetUser;
      user: { id: string; isOnboarded: boolean };
    }) => unknown,
  ) =>
    selector({
      setUser: mockSetUser,
      user: { id: 'user-1', isOnboarded: false },
    }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('OnboardingScreen', () => {
  const navigation = {
    canGoBack: jest.fn(() => false),
    goBack: jest.fn(),
    reset: jest.fn(),
  } as any;
  const route = {
    key: 'Onboarding',
    name: 'Onboarding',
  } as any;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUpdateFitness.mockResolvedValue({ data: {} });
    mockUpdateProfile.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const pressAndAdvance = (label: string) => {
    fireEvent.press(screen.getByText(label));
    act(() => { jest.advanceTimersByTime(400); });
  };

  it('submits canonical discovery intensity values for high-frequency onboarding choices', async () => {
    render(<OnboardingScreen navigation={navigation} route={route} />);

    pressAndAdvance('Get started');
    pressAndAdvance('Continue');
    fireEvent.press(screen.getByText('Women'));
    pressAndAdvance('Continue');
    fireEvent.press(screen.getByText('Lifting'));
    pressAndAdvance('Continue');
    fireEvent.press(screen.getByText('5–6x'));
    pressAndAdvance('Continue');
    fireEvent.press(screen.getByText('Gym'));
    pressAndAdvance('Continue');
    fireEvent.press(screen.getByText('Morning'));
    pressAndAdvance('Continue');
    fireEvent.press(screen.getByText('1-on-1'));
    pressAndAdvance('Continue');
    pressAndAdvance('Looks good');
    fireEvent.press(screen.getByText('Meet them now'));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          showMeMen: false,
          showMeWomen: true,
        }),
      );
      expect(mockUpdateFitness).toHaveBeenCalledWith(
        expect.objectContaining({
          weeklyFrequencyBand: '5-6',
          intensityLevel: 'high',
        }),
      );
    }, { timeout: 10000 });
  }, 25000);
});
