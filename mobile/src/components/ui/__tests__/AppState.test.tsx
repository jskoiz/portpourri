import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AppState from '../AppState';

describe('AppState', () => {
  it('renders title and description', () => {
    const { getByText } = render(<AppState title="No matches" description="Try again soon." />);
    expect(getByText('No matches')).toBeTruthy();
    expect(getByText('Try again soon.')).toBeTruthy();
  });

  it('fires its action', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <AppState title="Could not load" actionLabel="Retry" onAction={onAction} isError />,
    );
    fireEvent.press(getByText('Retry'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
