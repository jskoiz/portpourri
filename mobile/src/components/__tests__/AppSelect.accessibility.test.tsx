import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import AppSelect from '../ui/AppSelect';

const OPTIONS = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
];

describe('AppSelect accessibility', () => {
  it('exposes a combined label with field name and selected value', () => {
    const { getByLabelText } = render(
      <AppSelect
        label="Time"
        placeholder="Select time"
        options={OPTIONS}
        value="morning"
        onSelect={() => undefined}
      />,
    );
    expect(getByLabelText('Time: Morning')).toBeTruthy();
  });

  it('uses placeholder in label when no value selected', () => {
    const { getByLabelText } = render(
      <AppSelect
        label="Time"
        placeholder="Select time"
        options={OPTIONS}
        value=""
        onSelect={() => undefined}
      />,
    );
    expect(getByLabelText('Time: Select time')).toBeTruthy();
  });

  it('exposes expanded state when open', () => {
    const { getByLabelText } = render(
      <AppSelect
        label="Time"
        placeholder="Select time"
        options={OPTIONS}
        value=""
        onSelect={() => undefined}
      />,
    );
    const trigger = getByLabelText('Time: Select time');
    expect(trigger.props.accessibilityState).toEqual(
      expect.objectContaining({ expanded: false }),
    );
    fireEvent.press(trigger);
    expect(trigger.props.accessibilityState).toEqual(
      expect.objectContaining({ expanded: true }),
    );
  });

  it('exposes menuitem role and selected state on options', () => {
    const { getByLabelText, getAllByRole } = render(
      <AppSelect
        label="Time"
        placeholder="Select time"
        options={OPTIONS}
        value="morning"
        onSelect={() => undefined}
      />,
    );
    fireEvent.press(getByLabelText('Time: Morning'));
    const items = getAllByRole('menuitemradio');
    expect(items).toHaveLength(3);
    // First option is selected
    expect(items[0].props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    // Second option is not selected
    expect(items[1].props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false }),
    );
  });

  it('exposes disabled state', () => {
    const { getByLabelText } = render(
      <AppSelect
        label="Time"
        placeholder="Select time"
        options={OPTIONS}
        value=""
        onSelect={() => undefined}
        disabled
      />,
    );
    const trigger = getByLabelText('Time: Select time');
    expect(trigger.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });
});
