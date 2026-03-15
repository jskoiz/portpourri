import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AppInput from '../AppInput';

describe('AppInput', () => {
  it('renders label and value', () => {
    const { getByDisplayValue, getByText } = render(
      <AppInput label="Email" value="jordan@example.com" onChangeText={() => undefined} />,
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByDisplayValue('jordan@example.com')).toBeTruthy();
  });

  it('renders an error message', () => {
    const { getByText } = render(
      <AppInput label="Password" value="short" error="Too short" onChangeText={() => undefined} />,
    );
    expect(getByText('Too short')).toBeTruthy();
  });
});

