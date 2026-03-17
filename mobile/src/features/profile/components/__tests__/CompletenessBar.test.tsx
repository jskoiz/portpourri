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
      <CompletenessBar score={0} missing={MISSING_ITEMS} onPressMissing={onPressMissing} />,
    );

    expect(getByTestId('completeness-bar')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
    expect(getByText('Complete your profile')).toBeTruthy();
    expect(getByText('Add a bio')).toBeTruthy();
    expect(getByText('Add more photos')).toBeTruthy();
    expect(getByText('Set your city')).toBeTruthy();
  });

  it('renders at 50% with some missing items', () => {
    const { getByText } = render(
      <CompletenessBar score={50} missing={[MISSING_ITEMS[0]]} onPressMissing={onPressMissing} />,
    );

    expect(getByText('50%')).toBeTruthy();
    expect(getByText('Add a bio')).toBeTruthy();
  });

  it('does not render when score >= 80%', () => {
    const { queryByTestId } = render(
      <CompletenessBar score={80} missing={[]} onPressMissing={onPressMissing} />,
    );

    expect(queryByTestId('completeness-bar')).toBeNull();
  });

  it('does not render at 100%', () => {
    const { queryByTestId } = render(
      <CompletenessBar score={100} missing={[]} onPressMissing={onPressMissing} />,
    );

    expect(queryByTestId('completeness-bar')).toBeNull();
  });

  it('calls onPressMissing when a chip is tapped', () => {
    const { getByText } = render(
      <CompletenessBar score={50} missing={MISSING_ITEMS} onPressMissing={onPressMissing} />,
    );

    fireEvent.press(getByText('Add a bio'));

    expect(onPressMissing).toHaveBeenCalledWith(MISSING_ITEMS[0]);
  });
});
