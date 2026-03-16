import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SheetSelectField } from '../SheetSelectField';

describe('SheetSelectField', () => {
  it('provides explicit accessibility labels for the trigger and options', () => {
    const onSelect = jest.fn();

    render(
      <SheetSelectField
        label="Activity"
        onSelect={onSelect}
        options={[
          { label: 'Run', value: 'run', description: 'Outdoor pace-based activity' },
          { label: 'Yoga', value: 'yoga', description: 'Studio or recovery-friendly' },
        ]}
        placeholder="Pick an activity"
        sheetTitle="Choose an activity"
        value="run"
      />,
    );

    fireEvent.press(screen.getByLabelText('Activity: Run'));
    fireEvent.press(screen.getByLabelText('Yoga'));

    expect(onSelect).toHaveBeenCalledWith('yoga');
  });
});
