import React from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { normalizeApiError } from '../api/errors';
import AppState from '../components/ui/AppState';
import AppButton from '../components/ui/AppButton';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import AppIcon from '../components/ui/AppIcon';
import { useTheme } from '../theme/useTheme';
import { radii, spacing, typography } from '../theme/tokens';
import { useEventDetail } from '../features/events/hooks/useEventDetail';
import type { RootStackScreenProps } from '../core/navigation/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 300;

function formatDateRange(startsAt: string, endsAt?: string | null) {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const date = start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endTime = end ? end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : null;
  return { date, time: endTime ? `${startTime} – ${endTime}` : startTime };
}

export default function EventDetailScreen({
  route,
  navigation,
}: RootStackScreenProps<'EventDetail'>) {
  const theme = useTheme();
  const eventId = route.params?.eventId;
  const { error, event, isJoining: joining, isLoading: loading, joinEvent, refetch } =
    useEventDetail(eventId);
  const errorMessage = error ? normalizeApiError(error).message : null;

  const handleJoin = async () => {
    if (!event || joining || event.joined) return;
    try {
      await joinEvent();
    } catch {}
  };

  if (loading) return <AppState title="Loading event" loading />;
  if (errorMessage || !event) return <AppState title="Couldn't load event" description={errorMessage ?? 'Event not found'} actionLabel="Try again" onAction={() => { void refetch(); }} isError />;

  const dateInfo = formatDateRange(event.startsAt, event.endsAt);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <AppBackdrop />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Full-bleed hero */}
        <View style={styles.heroContainer}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: theme.surfaceElevated }]} />
          )}
          <View style={styles.heroOverlay} />

          {/* Back button overlay */}
          <View style={styles.backBtnOverlay}>
            <AppBackButton onPress={() => navigation.goBack()} style={{ marginBottom: 0 }} />
          </View>

          {/* Category badge */}
          {!!event.category && (
            <View style={[styles.heroBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.heroBadgeText, { color: theme.white }]}>{event.category}</Text>
            </View>
          )}
        </View>

        {/* Content card overlapping hero */}
        <View style={[styles.contentCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.kicker, { color: theme.accent }]}>EVENT DETAIL / SOCIAL MOTION</Text>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{event.title}</Text>
          <View style={[styles.hostStrip, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <View style={[styles.hostAvatar, { backgroundColor: theme.primarySubtle, borderColor: theme.primary }]}>
              <Text style={[styles.hostAvatarText, { color: theme.primary }]}>{event.host.firstName?.[0] ?? 'H'}</Text>
            </View>
            <View style={styles.hostCopy}>
              <Text style={[styles.hostLabel, { color: theme.textMuted }]}>Hosted by</Text>
              <Text style={[styles.hostName, { color: theme.textPrimary }]}>{event.host.firstName}</Text>
            </View>
            <Pressable style={[styles.hostPill, { borderColor: theme.border }]}>
              <Text style={[styles.hostPillText, { color: theme.textSecondary }]}>Open invite</Text>
            </Pressable>
          </View>

          {/* Metadata rows */}
          <View style={styles.metaList}>
            <MetaRow icon="calendar" label={dateInfo.date} sub={dateInfo.time} />
            <MetaRow icon="map-pin" label={event.location} />
            <MetaRow icon="users" label={`${event.attendeesCount} attending`} />
          </View>

          {event.description ? (
            <View style={[styles.descSection, { borderTopColor: theme.border }]}>
              <Text style={[styles.descLabel, { color: theme.accent }]}>About this event</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>{event.description}</Text>
            </View>
          ) : null}

          {/* CTA pinned inside card */}
          <View style={styles.ctaArea}>
            <AppButton
              label={event.joined ? "You're going" : joining ? 'Joining…' : 'Join event'}
              onPress={handleJoin}
              disabled={event.joined}
              loading={joining}
              variant="energy"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaRow({
  icon,
  label,
  sub,
}: {
  icon: React.ComponentProps<typeof AppIcon>['name'];
  label: string;
  sub?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.metaRow}>
      <View style={[styles.metaIconWrap, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <AppIcon name={icon} size={15} color={theme.primary} />
      </View>
      <View>
        <Text style={[styles.metaLabel, { color: theme.textPrimary }]}>{label}</Text>
        {sub ? <Text style={[styles.metaSub, { color: theme.textSecondary }]}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxl },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.5,
    backgroundColor: 'rgba(13,17,23,0.55)',
  },
  backBtnOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(13,17,23,0.50)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  heroBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
    minHeight: 300,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
    lineHeight: 36,
  },
  hostStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  hostAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  hostCopy: {
    flex: 1,
    marginLeft: spacing.md,
  },
  hostLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  hostName: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  hostPill: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  hostPillText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
  metaList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  metaIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  metaLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 24,
  },
  metaSub: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  descSection: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  descLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.body,
    lineHeight: 26,
  },
  ctaArea: {
    marginTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
