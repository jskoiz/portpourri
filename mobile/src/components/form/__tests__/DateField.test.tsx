import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DateField } from '../DateField';

describe('DateField', () => {
  it('commits a canonical date string and formats the display label', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <DateField
        label="Birthday"
        placeholder="Choose your birthdate"
        sheetTitle="Choose your birthdate"
        value=""
        onChange={onChange}
      />,
    );

    fireEvent.press(screen.getByText('date-field-picker'));
    fireEvent.press(screen.getByText('Done'));

    expect(onChange).toHaveBeenCalledWith('1995-02-03');

    rerender(
      <DateField
        label="Birthday"
        placeholder="Choose your birthdate"
        sheetTitle="Choose your birthdate"
        value="1995-02-03"
        onChange={onChange}
      />,
    );

    expect(screen.getByText('February 3, 1995')).toBeTruthy();
  });
});
