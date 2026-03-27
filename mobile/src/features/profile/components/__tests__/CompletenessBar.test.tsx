import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompletenessBar } from '../CompletenessBar';
import type { ProfileCompletenessMissingItem } from '../../../../api/types';

const MISSING_ITEMS: ProfileCompletenessMissingItem[] = [
  { field: 'bio', label: 'Add a bio', route: 'EditProfile' },
  { field: 'photos', label: 'Add more photos', route: 'EditPhotos' },
  { field: 'city', label: 'Set your city', route: 'EditProfile' },
];

describe('CompletenessBar', () => {
  const onPressMissing = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders at 0% with all missing items', () => {
    const { getByTestId, getByText } = render(
      <CompletenessBar earned={0} score={0} missing={MISSING_ITEMS} total={8} onPressMissing={onPressMissing} />,
    );

    expect(getByTestId('completeness-bar')).toBeTruthy();
    expect(getByTestId('completeness-bar').props.accessibilityRole).toBe('progressbar');
    expect(getByTestId('completeness-bar').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 0,
      text: '0% complete',
    });
    expect(getByText('0%')).toBeTruthy();
    expect(getByText('Complete your profile')).toBeTruthy();
    expect(getByText('3 steps left to finish')).toBeTruthy();
    expect(getByText('0 of 8 profile details complete')).toBeTruthy();
    expect(getByText('Add a bio')).toBeTruthy();
    expect(getByText('Add more photos')).toBeTruthy();
    expect(getByText('Set your city')).toBeTruthy();
  });

  it('renders at 50% with some missing items', () => {
    const { getByText } = render(
      <CompletenessBar earned={4} score={50} missing={[MISSING_ITEMS[0]]} total={8} onPressMissing={onPressMissing} />,
    );

    expect(getByText('50%')).toBeTruthy();
    expect(getByText('1 step left to finish')).toBeTruthy();
    expect(getByText('Add a bio')).toBeTruthy();
  });

  it('keeps rendering when the profile is still incomplete above 80%', () => {
    const { getByText } = render(
      <CompletenessBar earned={7} score={88} missing={[MISSING_ITEMS[0]]} total={8} onPressMissing={onPressMissing} />,
    );

    expect(getByText('88%')).toBeTruthy();
    expect(getByText('7 of 8 profile details complete')).toBeTruthy();
    expect(getByText('1 step left to finish')).toBeTruthy();
  });

  it('does not render when there are no missing steps', () => {
    const { queryByTestId } = render(
      <CompletenessBar earned={8} score={80} missing={[]} total={8} onPressMissing={onPressMissing} />,
    );

    expect(queryByTestId('completeness-bar')).toBeNull();
  });

  it('does not render at 100%', () => {
    const { queryByTestId } = render(
      <CompletenessBar earned={8} score={100} missing={[]} total={8} onPressMissing={onPressMissing} />,
    );

    expect(queryByTestId('completeness-bar')).toBeNull();
  });

  it('calls onPressMissing when a checklist row is tapped', () => {
    const { getByText } = render(
      <CompletenessBar earned={4} score={50} missing={MISSING_ITEMS} total={8} onPressMissing={onPressMissing} />,
    );

    fireEvent.press(getByText('Add a bio'));

    expect(onPressMissing).toHaveBeenCalledWith(MISSING_ITEMS[0]);
  });
});
