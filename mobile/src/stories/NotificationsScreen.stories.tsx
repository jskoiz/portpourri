import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import AppIcon from '../components/ui/AppIcon';
import { GlassView, StatePanel } from '../design/primitives';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import { makeNotification, withStoryScreenFrame } from './support';

type PreviewMode = 'loading' | 'empty' | 'error' | 'filled';

function NotificationRow({
  notification,
}: {
  notification: ReturnType<typeof makeNotification>;
}) {
  const theme = useTheme();
  const isRead = Boolean(notification.readAt);
  const color = isRead ? theme.textMuted : theme.primary;

  return (
    <Pressable
      onPress={() => undefined}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.body}`}
      accessibilityHint={isRead ? 'Already read' : 'Tap to mark as read'}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 64,
          borderRadius: radii.lg,
          backgroundColor: isRead ? theme.surface : theme.accentSoft,
          padding: spacing.md,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}20`,
        }}
      >
        <AppIcon name="bell" size={16} color={color} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: theme.textPrimary, fontSize: typography.body, fontWeight: '800' }}>
          {notification.title}
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: typography.bodySmall, lineHeight: 20 }}>
          {notification.body}
        </Text>
      </View>
      {!isRead ? (
        <Pressable
          onPress={() => undefined}
          accessibilityRole="button"
          accessibilityLabel="Mark as read"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <AppIcon name="check" size={16} color={color} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

function NotificationsScreenStory({ mode }: { mode: PreviewMode }) {
  const theme = useTheme();
  const notifications = [
    makeNotification({
      id: 'notif-1',
      title: 'New message',
      body: 'Want to meet for coffee after the run?',
      type: 'message_received',
    }),
    makeNotification({
      id: 'notif-2',
      title: 'Event reminder',
      body: 'Makapuu sunrise hike starts tomorrow at 6:00 AM.',
      type: 'event_reminder',
      readAt: '2026-03-25T00:00:00.000Z',
    }),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AppBackdrop />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.xxl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
        }}
      >
        <AppBackButton onPress={() => undefined} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.textPrimary, fontSize: typography.h2, fontWeight: '800' }}>
            Notifications
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xxl }}>
        {mode === 'loading' ? (
          <StatePanel title="Loading notifications" loading />
        ) : mode === 'error' ? (
          <StatePanel
            title="Couldn't load notifications"
            description="Notifications offline for preview."
            actionLabel="Try again"
            onAction={() => undefined}
            isError
          />
        ) : mode === 'empty' ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.md,
              paddingBottom: spacing.xl,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.accentSoft,
              }}
            >
              <AppIcon name="bell" size={24} color={theme.accentPrimary} />
            </View>
            <Text style={{ color: theme.textPrimary, fontSize: typography.h3, fontWeight: '800' }}>
              No notifications
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: typography.bodySmall,
                lineHeight: 20,
                textAlign: 'center',
                maxWidth: 280,
              }}
            >
              You&apos;ll see matches, messages, and event updates here.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: theme.textMuted, fontSize: typography.caption, fontWeight: '800' }}>
                Today
              </Text>
              <Pressable
                onPress={() => undefined}
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: theme.textMuted, fontSize: typography.bodySmall, fontWeight: '700' }}>
                  Clear all
                </Text>
              </Pressable>
            </View>
            <NotificationRow notification={notifications[0]} />
            <NotificationRow notification={notifications[1]} />
          </View>
        )}

        <View style={{ height: spacing.xl }} />
        <GlassView tier="light" borderRadius={radii.lg} style={{ padding: spacing.md }}>
          <Text style={{ color: theme.textMuted, fontSize: typography.caption, fontWeight: '700' }}>
            Preview
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: typography.bodySmall, lineHeight: 20 }}>
            Row labels, hints, and 44px+ hit areas mirror the live notifications flow.
          </Text>
        </GlassView>
      </View>
    </View>
  );
}

const meta = {
  title: 'Screens/NotificationsShell',
  component: NotificationsScreenStory,
  decorators: [withStoryScreenFrame({ centered: false, height: 920 })],
  args: {
    mode: 'filled',
  },
} satisfies Meta<typeof NotificationsScreenStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Loading: Story = {
  args: {
    mode: 'loading',
  },
};

export const Empty: Story = {
  args: {
    mode: 'empty',
  },
};

export const ErrorState: Story = {
  args: {
    mode: 'error',
  },
};
