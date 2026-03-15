import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, Input, StatePanel } from '../design/primitives';

const meta = {
  title: 'Design/Primitives',
  decorators: [
    (Story) => (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Button label="Join BRDG" onPress={() => undefined} />
      <Button label="Create Activity" onPress={() => undefined} variant="accent" />
      <Button label="Need attention" onPress={() => undefined} variant="danger" />
      <Button label="Loading" onPress={() => undefined} loading />
    </View>
  ),
};

export const CardVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Card><View style={{ minHeight: 40 }} /></Card>
      <Card variant="glass"><View style={{ minHeight: 40 }} /></Card>
      <Card accent="#34D399"><View style={{ minHeight: 40 }} /></Card>
    </View>
  ),
};

export const InputStates: Story = {
  render: () => (
    <View>
      <Input label="Email" value="jordan@example.com" onChangeText={() => undefined} />
      <Input label="Password" value="short" error="Password must be at least 8 characters." onChangeText={() => undefined} />
    </View>
  ),
};

export const ChipStates: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Chip label="Strength" active onPress={() => undefined} />
      <Chip label="Mobility" onPress={() => undefined} />
      <Chip label="Read-only" active interactive={false} accentColor="#34D399" />
    </View>
  ),
};

export const StatePanels: Story = {
  render: () => (
    <View style={{ gap: 24 }}>
      <StatePanel title="Loading discovery" loading />
      <StatePanel title="Could not load events" description="Network request timed out." actionLabel="Retry" onAction={() => undefined} isError />
    </View>
  ),
};

