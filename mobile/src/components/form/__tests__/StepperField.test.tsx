import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StepperField } from '../StepperField';

describe('StepperField', () => {
  it('emits bounded next values', () => {
    const onChange = jest.fn();

    const { rerender } = render(
      <StepperField label="Distance" min={1} max={3} value={2} onChange={onChange} />,
    );

    fireEvent.press(screen.getByLabelText('Increase Distance'));
    fireEvent.press(screen.getByLabelText('Decrease Distance'));

    expect(onChange).toHaveBeenNthCalledWith(1, 3);
    expect(onChange).toHaveBeenNthCalledWith(2, 1);

    onChange.mockClear();
    rerender(<StepperField label="Distance" min={1} max={3} value={3} onChange={onChange} />);
    fireEvent.press(screen.getByLabelText('Increase Distance'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
