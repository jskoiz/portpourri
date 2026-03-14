import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import SignupScreen from '../SignupScreen';

const mockSignup = jest.fn();

jest.mock('../../store/authStore', () => ({
  useAuthStore: (selector: (state: { signup: typeof mockSignup }) => unknown) =>
    selector({ signup: mockSignup }),
}));

describe('SignupScreen', () => {
  const navigation = {
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates later signup steps before allowing submission', async () => {
    render(<SignupScreen navigation={navigation} />);

    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Jordan');
    fireEvent.press(screen.getByText('Continue'));

    expect(await screen.findByText('Secure your account.')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'not-an-email');
    fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'short');
    fireEvent.press(screen.getByText('Continue'));

    expect(await screen.findByText('Enter a valid email.')).toBeTruthy();
    expect(screen.getByText('Use at least 8 characters.')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'Jordan@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.press(screen.getByText('Continue'));

    expect(await screen.findByText('One last thing.')).toBeTruthy();

    fireEvent.press(screen.getByText('Month'));
    fireEvent.press(screen.getByText('February'));
    fireEvent.press(screen.getByText('Day'));
    fireEvent.press(screen.getByText('31'));
    fireEvent.press(screen.getByText('Year'));
    fireEvent.press(screen.getByText('1995'));
    fireEvent.press(screen.getByText('Choose a gender'));
    fireEvent.press(screen.getByText('Non-binary'));
    fireEvent.press(screen.getByText('Create my account'));

    expect(await screen.findByText('Choose a real birthdate.')).toBeTruthy();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('submits normalized signup data after completing the flow', async () => {
    mockSignup.mockResolvedValue(undefined);

    render(<SignupScreen navigation={navigation} />);

    fireEvent.changeText(screen.getByPlaceholderText('Alex'), ' Jordan ');
    fireEvent.press(screen.getByText('Continue'));

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'Jordan@Example.com ');
    fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.press(screen.getByText('Continue'));

    fireEvent.press(screen.getByText('Month'));
    fireEvent.press(screen.getByText('February'));
    fireEvent.press(screen.getByText('Day'));
    fireEvent.press(screen.getByText('3'));
    fireEvent.press(screen.getByText('Year'));
    fireEvent.press(screen.getByText('1995'));
    fireEvent.press(screen.getByText('Choose a gender'));
    fireEvent.press(screen.getByText('Non-binary'));
    fireEvent.press(screen.getByText('Create my account'));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        email: 'jordan@example.com',
        password: 'password123',
        firstName: 'Jordan',
        birthdate: '1995-02-03',
        gender: 'non-binary',
      });
    });
  });

  it('shows a signup failure alert when the API call rejects', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockSignup.mockRejectedValue(new Error('Email already in use'));

    render(<SignupScreen navigation={navigation} />);

    fireEvent.changeText(screen.getByPlaceholderText('Alex'), 'Jordan');
    fireEvent.press(screen.getByText('Continue'));
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'jordan@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 8 characters'), 'password123');
    fireEvent.press(screen.getByText('Continue'));
    fireEvent.press(screen.getByText('Month'));
    fireEvent.press(screen.getByText('February'));
    fireEvent.press(screen.getByText('Day'));
    fireEvent.press(screen.getByText('3'));
    fireEvent.press(screen.getByText('Year'));
    fireEvent.press(screen.getByText('1995'));
    fireEvent.press(screen.getByText('Choose a gender'));
    fireEvent.press(screen.getByText('Non-binary'));
    fireEvent.press(screen.getByText('Create my account'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Couldn't create account", 'Email already in use');
    });

    alertSpy.mockRestore();
  });
});
