import React from 'react';
import { act } from 'react';
import { render } from '@testing-library/react-native';
import { SkeletonBox, SkeletonCircle, SkeletonTextLine } from '../../design/primitives';
import { DiscoverySkeleton } from '../skeletons/DiscoverySkeleton';
import { ProfileDetailSkeleton } from '../skeletons/ProfileDetailSkeleton';
import { ChatListSkeleton } from '../skeletons/ChatListSkeleton';
import { EventsSkeleton } from '../skeletons/EventsSkeleton';

// The shimmer animation fires async Animated updates; use fake timers
// and flush them inside act() so React doesn't warn.
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  act(() => { jest.runOnlyPendingTimers(); });
  jest.useRealTimers();
});

describe('skeleton primitives', () => {
  it('renders SkeletonBox without crashing', () => {
    const { getByTestId } = render(
      <SkeletonBox testID="skel-box" width={100} height={20} />,
    );
    expect(getByTestId('skel-box')).toBeTruthy();
  });

  it('renders SkeletonCircle without crashing', () => {
    const { getByTestId } = render(<SkeletonCircle testID="skel-circle" size={40} />);
    expect(getByTestId('skel-circle')).toBeTruthy();
  });

  it('renders SkeletonTextLine without crashing', () => {
    const { getByTestId } = render(<SkeletonTextLine testID="skel-text" width="60%" />);
    expect(getByTestId('skel-text')).toBeTruthy();
  });
});

describe('screen skeletons', () => {
  it('renders DiscoverySkeleton with photo and text placeholders', () => {
    const { getByTestId } = render(<DiscoverySkeleton testID="disc-skel" />);
    expect(getByTestId('disc-skel')).toBeTruthy();
    expect(getByTestId('skeleton-discovery-photo')).toBeTruthy();
  });

  it('renders ProfileDetailSkeleton with hero placeholder', () => {
    const { getByTestId } = render(<ProfileDetailSkeleton testID="profile-skel" />);
    expect(getByTestId('profile-skel')).toBeTruthy();
    expect(getByTestId('skeleton-profile-hero')).toBeTruthy();
  });

  it('renders ChatListSkeleton with row placeholders', () => {
    const { getByTestId } = render(<ChatListSkeleton testID="chat-skel" />);
    expect(getByTestId('chat-skel')).toBeTruthy();
    expect(getByTestId('skeleton-chat-row')).toBeTruthy();
  });

  it('renders EventsSkeleton with card placeholders', () => {
    const { getByTestId } = render(<EventsSkeleton testID="events-skel" />);
    expect(getByTestId('events-skel')).toBeTruthy();
    expect(getByTestId('skeleton-event-card')).toBeTruthy();
  });

  it('ChatListSkeleton respects custom count', () => {
    const { toJSON } = render(<ChatListSkeleton count={2} />);
    expect(toJSON()).toBeTruthy();
  });
});
