import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import AppBackdrop from '../components/ui/AppBackdrop';
import AppBackButton from '../components/ui/AppBackButton';
import AppIcon from '../components/ui/AppIcon';
import AppNotificationButton from '../components/ui/AppNotificationButton';
import AppSelect from '../components/ui/AppSelect';
import { withStoryScreenFrame } from './support';

function AppUiStory() {
  const [value, setValue] = React.useState('moderate');

  return (
    <View style={{ gap: 20, padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <AppBackButton label="Back" onPress={() => undefined} />
        <AppNotificationButton unreadCount={7} onPress={() => undefined} />
        <AppIcon name="sliders" size={18} />
      </View>

      <AppSelect
        label="Intensity"
        onSelect={setValue}
        options={[
          { label: 'Easy', value: 'easy' },
          { label: 'Moderate', value: 'moderate' },
          { label: 'Hard', value: 'hard' },
        ]}
        placeholder="Choose intensity"
        value={value}
      />

      <View
        style={{
          height: 160,
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 24,
          backgroundColor: '#F7F4F0',
        }}
      >
        <AppBackdrop />
      </View>
    </View>
  );
}

function AppUiPlaceholderSelectStory() {
  const [value, setValue] = React.useState('');

  return (
    <View style={{ gap: 20, padding: 24 }}>
      <AppSelect
        label="Intensity"
        onSelect={setValue}
        options={[
          { label: 'Easy', value: 'easy' },
          { label: 'Moderate', value: 'moderate' },
          { label: 'Hard', value: 'hard' },
        ]}
        placeholder="Choose intensity"
        value={value}
      />
    </View>
  );
}

const meta = {
  title: 'Components/AppUi',
  component: AppUiStory,
  decorators: [withStoryScreenFrame({ centered: false, height: 760 })],
} satisfies Meta<typeof AppUiStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PlaceholderSelect: Story = {
  render: () => <AppUiPlaceholderSelectStory />,
};
