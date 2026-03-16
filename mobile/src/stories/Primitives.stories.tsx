import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { Button, Card, Chip, Input, StatePanel } from '../design/primitives';
import { withStorySurface } from './support';

const meta = {
  title: 'Design/Primitives',
  decorators: [withStorySurface({ centered: false })],
} satisfies Meta<typeof View>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonVariants: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Button label="Join BRDG" onPress={() => undefined} />
      <Button label="Maybe Later" onPress={() => undefined} variant="secondary" />
      <Button label="Create Activity" onPress={() => undefined} variant="accent" />
      <Button label="Skip" onPress={() => undefined} variant="ghost" />
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
      <Card accent="#8BAA7A"><View style={{ minHeight: 40 }} /></Card>
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
      <Chip label="Read-only" active interactive={false} accentColor="#8BAA7A" />
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
