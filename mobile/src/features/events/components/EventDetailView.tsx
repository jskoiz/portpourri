import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { EventDetail } from '../../../api/types';
import AppBackButton from '../../../components/ui/AppBackButton';
import { Button, ScreenScaffold, SectionBlock, StatePanel } from '../../../design/primitives';
import { useTheme } from '../../../theme/useTheme';
import { eventDetailStyles as styles } from './eventDetail.styles';
import { formatEventDateRange } from './eventDetail.formatters';
import { EventDetailMetaRow } from './EventDetailMetaRow';

export type EventDetailViewProps = {
  errorMessage: string | null;
  event: EventDetail | null;
  isJoining: boolean;
  isLoading: boolean;
  onBack: () => void;
  onJoin: () => void;
  onPressHost: () => void;
  onRefresh: () => void;
};

export function EventDetailView({
  errorMessage,
  event,
  isJoining,
  isLoading,
  onBack,
  onJoin,
  onPressHost,
  onRefresh,
}: EventDetailViewProps) {
  const theme = useTheme();

  if (isLoading) return <StatePanel title="Loading event" loading />;

  if (errorMessage || !event) {
    return (
      <StatePanel
        title="Couldn't load event"
        description={errorMessage ?? 'Event not found'}
        actionLabel="Try again"
        onAction={onRefresh}
        isError
      />
    );
  }

  const dateInfo = formatEventDateRange(event.startsAt, event.endsAt);

  return (
    <ScreenScaffold style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              accessibilityLabel={`Event image for ${event.title}`}
            />
          ) : (
            <View
              style={[styles.heroImage, { backgroundColor: theme.surfaceElevated }]}
              accessibilityLabel="No event image"
            />
          )}
          <LinearGradient
            colors={['rgba(29,24,20,0)', 'rgba(29,24,20,0.1)', 'rgba(29,24,20,0.58)']}
            locations={[0.1, 0.52, 1]}
            style={styles.heroOverlay}
            pointerEvents="none"
          />

          <View style={styles.backBtnOverlay}>
            <AppBackButton onPress={onBack} style={{ marginBottom: 0 }} />
          </View>

          {!!event.category && (
            <View style={[styles.heroBadge, { backgroundColor: theme.selectedFill }]} accessibilityLabel={`Category: ${event.category}`}>
              <Text style={[styles.heroBadgeText, { color: theme.selectedText }]}>{event.category}</Text>
            </View>
          )}
        </View>

        <View style={[styles.contentCard, { backgroundColor: theme.surface }]}>
          <SectionBlock
            inset={false}
            spacingMode="tight"
            eyebrow="Event detail / Social motion"
            title={event.title}
            titleVariant="screen"
            eyebrowStyle={[styles.kicker, { color: theme.accentPrimary }]}
            titleStyle={[styles.title, { color: theme.textPrimary }]}
          />
          <Pressable
            onPress={onPressHost}
            style={[styles.hostStrip, { backgroundColor: theme.subduedSurface }]}
            accessibilityRole="button"
            accessibilityLabel={`Open profile for ${event.host.firstName ?? 'the host'}`}
            accessibilityHint="Navigates to the host’s profile"
          >
            <View style={[styles.hostAvatar, { backgroundColor: theme.selectedFill }]}>
              <Text style={[styles.hostAvatarText, { color: theme.selectedText }]}>
                {event.host.firstName?.[0] ?? 'H'}
              </Text>
            </View>
            <View style={styles.hostCopy}>
              <Text style={[styles.hostLabel, { color: theme.textMuted }]}>Hosted by</Text>
              <Text style={[styles.hostName, { color: theme.textPrimary }]}>
                {event.host.firstName}
              </Text>
            </View>
            <View
              style={[styles.hostPill, { backgroundColor: theme.chipSurface, minHeight: 36 }]}
              accessibilityLabel="Open invite"
              accessibilityRole="text"
            >
              <Text style={[styles.hostPillText, { color: theme.textSecondary }]}>Open invite</Text>
            </View>
          </Pressable>

          <View style={styles.metaList}>
            <EventDetailMetaRow icon="calendar" label={dateInfo.date} sub={dateInfo.time} />
            <EventDetailMetaRow icon="map-pin" label={event.location} />
            <EventDetailMetaRow icon="users" label={`${event.attendeesCount} attending`} />
          </View>

          {event.description ? (
            <SectionBlock inset={false} spacingMode="tight">
              <Text style={[styles.descLabel, { color: theme.accentPrimary }]}>About this event</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>
                {event.description}
              </Text>
            </SectionBlock>
          ) : null}

          <View style={styles.ctaArea}>
            <Button
              label={event.joined ? "You're going" : isJoining ? 'Joining…' : 'Join event'}
              onPress={onJoin}
              disabled={event.joined}
              loading={isJoining}
              variant="primary"
              style={styles.ctaButton}
            />
          </View>
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}
