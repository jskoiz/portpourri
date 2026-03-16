import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LocationField } from '../LocationField';

describe('LocationField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('supports manual fallback and persists the selection as a recent', async () => {
    const onChangeText = jest.fn();

    render(
      <LocationField
        kind="place"
        label="Where"
        placeholder="Runyon Canyon, Venice Beach..."
        sheetTitle="Choose a location"
        value=""
        onChangeText={onChangeText}
      />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Runyon Canyon, Venice Beach...'), 'Garage Gym');
    fireEvent.press(screen.getByText('Use "Garage Gym"'));

    expect(onChangeText).toHaveBeenCalledWith('Garage Gym');

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  it('loads recent suggestions before curated matches', async () => {
    await AsyncStorage.setItem(
      'brdg/recent-location-suggestions/v1',
      JSON.stringify([
        {
          id: 'recent:magic island',
          label: 'Magic Island',
          value: 'Magic Island',
          source: 'recent',
        },
      ]),
    );

    render(
      <LocationField
        kind="place"
        label="Where"
        placeholder="Runyon Canyon, Venice Beach..."
        sheetTitle="Choose a location"
        value=""
        onChangeText={() => undefined}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Magic Island')).toBeTruthy();
    });

    expect(screen.getByText('Recent selection')).toBeTruthy();
  });
});
