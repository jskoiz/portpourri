import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createScreenNavigation, createScreenRoute } from '../../lib/testing/screenProps';
import LoginScreen from '../LoginScreen';

const mockLogin = jest.fn();

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { login: typeof mockLogin }) => unknown) =>
    selector({ login: mockLogin }),
}));

describe('LoginScreen', () => {
  const navigation = createScreenNavigation();
  const route = createScreenRoute('Login');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required fields before submitting', async () => {
    render(<LoginScreen navigation={navigation} route={route} />);

    fireEvent.press(screen.getByText('Sign in'));

    expect(await screen.findByText('Email is required.')).toBeTruthy();
    expect(screen.getByText('Password is required.')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('submits normalized credentials', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(<LoginScreen navigation={navigation} route={route} />);

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'Jordan@Example.com ');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password123');
    fireEvent.press(screen.getByText('Sign in'));

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
    fireEvent.press(screen.getByText('Sign in'));

    expect(await screen.findByText('Invalid credentials')).toBeTruthy();
  });
});
