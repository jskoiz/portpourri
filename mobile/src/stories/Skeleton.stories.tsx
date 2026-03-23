import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SkeletonBox, SkeletonCircle, SkeletonTextLine } from '../design/primitives';
import { DiscoverySkeleton } from '../components/skeletons/DiscoverySkeleton';
import { ProfileDetailSkeleton } from '../components/skeletons/ProfileDetailSkeleton';
import { ChatListSkeleton } from '../components/skeletons/ChatListSkeleton';
import { EventsSkeleton } from '../components/skeletons/EventsSkeleton';
import { withStorySurface } from './support';

const meta = {
  title: 'Design/Skeleton',
  decorators: [withStorySurface({ centered: false })],
} satisfies Meta<typeof View>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primitives: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 16 }}>
      <Text style={{ fontWeight: '700', marginBottom: 4 }}>SkeletonBox</Text>
      <SkeletonBox width="100%" height={24} />
      <SkeletonBox width="60%" height={24} />
      <SkeletonBox width={120} height={120} borderRadius={20} />

      <Text style={{ fontWeight: '700', marginTop: 12, marginBottom: 4 }}>SkeletonCircle</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <SkeletonCircle size={32} />
        <SkeletonCircle size={48} />
        <SkeletonCircle size={64} />
      </View>

      <Text style={{ fontWeight: '700', marginTop: 12, marginBottom: 4 }}>SkeletonTextLine</Text>
      <SkeletonTextLine width="90%" />
      <SkeletonTextLine width="75%" />
      <SkeletonTextLine width="50%" />
    </View>
  ),
};

export const DiscoveryScreen: Story = {
  render: () => <DiscoverySkeleton />,
};

export const ProfileDetail: Story = {
  render: () => (
    <ScrollView>
      <ProfileDetailSkeleton />
    </ScrollView>
  ),
};

export const ChatList: Story = {
  render: () => <ChatListSkeleton />,
};

export const Events: Story = {
  render: () => (
    <View style={{ padding: 16 }}>
      <EventsSkeleton />
    </View>
  ),
};
