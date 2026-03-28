import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import AppIcon from '../components/ui/AppIcon';
import { GlassView, StatePanel } from '../design/primitives';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import { makeEventSummary, withStoryScreenFrame } from './support';

type ViewMode = 'loading' | 'empty-joined' | 'empty-created' | 'error' | 'filled';

function EventCard({
  event,
}: {
  event: ReturnType<typeof makeEventSummary>;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => undefined}
      accessibilityRole="button"
      accessibilityLabel={`Event: ${event.title}. ${event.location}. ${event.attendeesCount} attending`}
      style={({ pressed }) => [
        {
          borderRadius: radii.lg,
          backgroundColor: theme.surface,
          opacity: pressed ? 0.9 : 1,
          padding: spacing.md,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primarySubtle,
          }}
        >
          <AppIcon name="calendar" size={18} color={theme.primary} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ color: theme.textPrimary, fontSize: typography.body, fontWeight: '800' }}>
            {event.title}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: typography.bodySmall }}>
            {event.location}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: typography.caption }}>
            {event.attendeesCount} attending
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function MyEventsScreenStory({ mode }: { mode: ViewMode }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = React.useState<'Joined' | 'Created'>(
    mode === 'empty-created' ? 'Created' : 'Joined',
  );

  React.useEffect(() => {
    setActiveTab(mode === 'empty-created' ? 'Created' : 'Joined');
  }, [mode]);
  const joinedEvents = [
    makeEventSummary({
      id: 'event-1',
      title: 'Makapuu sunrise hike',
      location: 'Makapuu Trail',
      attendeesCount: 6,
      joined: true,
    }),
  ];
  const createdEvents = [
    makeEventSummary({
      id: 'event-2',
      title: 'Kakaako strength hour',
      location: 'Honolulu Strength Lab',
      attendeesCount: 4,
      joined: true,
    }),
  ];
  const displayedEvents = activeTab === 'Joined' ? joinedEvents : createdEvents;
  const emptyCopy =
    activeTab === 'Joined'
      ? {
          title: 'No events joined yet',
          body: 'Find something that excites you and jump in.',
          cta: 'Explore Events',
        }
      : {
          title: "You haven't hosted anything yet",
          body: 'Start an activity and invite people to move with you.',
          cta: 'Create Activity',
        };

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
            My Events
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: spacing.xxl,
          marginBottom: spacing.lg,
          borderRadius: radii.xl,
          backgroundColor: theme.chipSurface,
        }}
      >
        {(['Joined', 'Created'] as const).map((tab) => {
          const selected = activeTab === tab;
          const count = tab === 'Joined' ? joinedEvents.length : createdEvents.length;

          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${tab} events, ${count} items`}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radii.pill,
                backgroundColor: selected ? theme.selectedFill : 'transparent',
              }}
            >
              <Text
                style={{
                  color: selected ? theme.selectedText : theme.textSecondary,
                  fontSize: typography.bodySmall,
                  fontWeight: '800',
                }}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.xxl }}>
        {mode === 'loading' ? (
          <StatePanel title="Loading your events" loading />
        ) : mode === 'error' ? (
          <StatePanel
            title="Couldn't load events"
            description="Events offline for preview."
            actionLabel="Try again"
            onAction={() => undefined}
            isError
          />
        ) : mode === 'empty-joined' ? (
          <View style={{ gap: spacing.md }}>
            <StatePanel
              title={emptyCopy.title}
              description={emptyCopy.body}
              actionLabel={emptyCopy.cta}
              onAction={() => undefined}
            />
          </View>
        ) : mode === 'empty-created' ? (
          <View style={{ gap: spacing.md }}>
            <StatePanel
              title={emptyCopy.title}
              description={emptyCopy.body}
              actionLabel={emptyCopy.cta}
              onAction={() => undefined}
            />
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {displayedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
        <GlassView tier="light" borderRadius={radii.lg} style={{ padding: spacing.md }}>
          <Text style={{ color: theme.textMuted, fontSize: typography.caption, fontWeight: '700' }}>
            Preview
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: typography.bodySmall, lineHeight: 20 }}>
            The shell keeps the same tab count semantics, empty-state copy, and 48px tap targets as the live screen.
          </Text>
        </GlassView>
      </View>
    </View>
  );
}

const meta = {
  title: 'Screens/MyEventsShell',
  component: MyEventsScreenStory,
  decorators: [withStoryScreenFrame({ centered: false, height: 920 })],
  args: {
    mode: 'filled',
  },
} satisfies Meta<typeof MyEventsScreenStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Loading: Story = {
  args: {
    mode: 'loading',
  },
};

export const EmptyJoined: Story = {
  args: {
    mode: 'empty-joined',
  },
};

export const EmptyCreated: Story = {
  args: {
    mode: 'empty-created',
  },
};

export const ErrorState: Story = {
  args: {
    mode: 'error',
  },
};
