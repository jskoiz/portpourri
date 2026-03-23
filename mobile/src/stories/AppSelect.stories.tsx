import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import AppSelect from '../components/ui/AppSelect';
import { withStoryScreenFrame } from './support';

function AppSelectStory({
  label = 'Intensity',
  options = [
    { label: 'Easy', value: 'easy' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'Hard', value: 'hard' },
  ],
  initialValue = 'moderate',
  disabled = false,
  placeholder = 'Choose intensity',
}: {
  label?: string;
  options?: { label: string; value: string }[];
  initialValue?: string;
  disabled?: boolean;
  placeholder?: string;
}): React.JSX.Element {
  const [value, setValue] = React.useState(initialValue);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <AppSelect
        disabled={disabled}
        label={label}
        onSelect={setValue}
        options={options}
        placeholder={placeholder}
        value={value}
      />
    </View>
  );
}

const meta = {
  title: 'Components/AppSelect',
  component: AppSelectStory,
  decorators: [withStoryScreenFrame({ centered: false, height: 420 })],
} satisfies Meta<typeof AppSelectStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SelectedValue: Story = {};

export const PlaceholderState: Story = {
  args: {
    initialValue: '',
  },
};

export const EmptyOptions: Story = {
  args: {
    initialValue: '',
    options: [],
    placeholder: 'No categories available',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
