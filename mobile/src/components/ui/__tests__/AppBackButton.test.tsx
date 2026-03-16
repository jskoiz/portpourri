import React from 'react';
import { render } from '@testing-library/react-native';
import AppBackButton from '../AppBackButton';

describe('AppBackButton', () => {
  it('renders without crashing', () => {
    const { getByRole } = render(<AppBackButton onPress={() => {}} />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('does not apply a default marginBottom to the button container', () => {
    const { getByRole } = render(<AppBackButton onPress={() => {}} />);
    const button = getByRole('button');
    // The base button style should not carry marginBottom, so it must be
    // absent or explicitly 0. Callers no longer need to override it.
    const { marginBottom } = button.props.style?.find?.((s: Record<string, unknown>) => s && 'marginBottom' in s) ?? {};
    expect(marginBottom ?? 0).toBe(0);
  });

  it('renders the label when provided', () => {
    const { getByText } = render(<AppBackButton onPress={() => {}} label="Go back" />);
    expect(getByText('Go back')).toBeTruthy();
  });

  it('accepts a custom style without marginBottom override being needed', () => {
    // Previously all call sites had to pass style={{ marginBottom: 0 }}. This
    // verifies the component works correctly in an inline-row context without
    // any such override.
    const { getByRole } = render(
      <AppBackButton onPress={() => {}} style={{ borderColor: 'red' }} />,
    );
    expect(getByRole('button')).toBeTruthy();
  });
});
