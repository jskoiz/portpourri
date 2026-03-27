import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createScreenNavigation, createScreenRoute } from '../../lib/testing/screenProps';
import LoginScreen from '../LoginScreen';

const mockLogin = jest.fn();
const mockLoginWithGoogle = jest.fn();
const mockLoginWithApple = jest.fn();

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: {
    login: typeof mockLogin;
    loginWithGoogle: typeof mockLoginWithGoogle;
    loginWithApple: typeof mockLoginWithApple;
  }) => unknown) =>
    selector({
      login: mockLogin,
      loginWithGoogle: mockLoginWithGoogle,
      loginWithApple: mockLoginWithApple,
    }),
}));

jest.mock('../../features/auth/hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({ signIn: jest.fn(), isLoading: false, isReady: false }),
}));

jest.mock('../../features/auth/hooks/useAppleAuth', () => ({
  useAppleAuth: () => ({ signIn: jest.fn(), isLoading: false, isAvailable: false }),
}));

describe('LoginScreen', () => {
  const navigation = createScreenNavigation();
  const route = createScreenRoute('Login');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required fields before submitting', async () => {
    render(<LoginScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByTestId('login-submit-button'));

    expect(await screen.findByText('Email is required.')).toBeTruthy();
    expect(screen.getByText('Password is required.')).toBeTruthy();
    expect(screen.getByLabelText('Email').props.accessibilityState).toEqual({
      disabled: false,
      invalid: true,
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits normalized credentials', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(<LoginScreen navigation={navigation} route={route} />);

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'Jordan@Example.com ');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'jordan@example.com',
        password: 'password123',
      });
    });
  });

  it('shows API failures inline', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(<LoginScreen navigation={navigation} route={route} />);

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'jordan@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'bad-password');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    expect(await screen.findByText('Invalid credentials')).toBeTruthy();
    expect(screen.getByLabelText('Invalid credentials').props.accessibilityRole).toBe('alert');
  });
});
