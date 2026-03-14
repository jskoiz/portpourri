import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import OnboardingScreen from '../OnboardingScreen';

const mockUpdateFitness = jest.fn();
const mockSetUser = jest.fn();

jest.mock('../../services/api', () => ({
  profileApi: {
    updateFitness: (...args: unknown[]) => mockUpdateFitness(...args),
  },
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
    jest.clearAllMocks();
    mockUpdateFitness.mockResolvedValue({ data: {} });
  });

  it('submits canonical discovery intensity values for high-frequency onboarding choices', async () => {
    render(<OnboardingScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText("Let's go →"));
    fireEvent.press(screen.getByText('Continue'));
    fireEvent.press(screen.getByText('Lifting'));
    fireEvent.press(screen.getByText('Continue'));
    fireEvent.press(screen.getByText('5–6x'));
    fireEvent.press(screen.getByText('Continue'));
    fireEvent.press(screen.getByText('Gym'));
    fireEvent.press(screen.getByText('Continue'));
    fireEvent.press(screen.getByText('Morning'));
    fireEvent.press(screen.getByText('Continue'));
    fireEvent.press(screen.getByText('1-on-1'));
    fireEvent.press(screen.getByText('Continue'));
    fireEvent.press(screen.getByText("That's me →"));
    fireEvent.press(screen.getByText('Meet them now'));

    await waitFor(() => {
      expect(mockUpdateFitness).toHaveBeenCalledWith(
        expect.objectContaining({
          weeklyFrequencyBand: '5-6',
          intensityLevel: 'high',
        }),
      );
    });
  });
});
