import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AppIcon from '../../../components/ui/AppIcon';
import { Button, Card } from '../../../design/primitives';
import { useTheme } from '../../../theme/useTheme';
import { radii, spacing, typography } from '../../../theme/tokens';
import { eventsApi } from '../../../services/api';
import { invalidateEventSurfaces } from '../../../lib/query/queryInvalidation';
import type { EventInviteResponse } from '../../../api/types';

export type EventInviteCardStatus = 'pending' | 'accepted' | 'expired';

export interface EventInviteCardProps {
  eventId: string;
  title: string;
  location: string;
  startsAt: string;
  endsAt?: string | null;
  status: EventInviteCardStatus;
  isMe: boolean;
  onNavigateToEvent?: (eventId: string) => void;
}

function formatInviteDate(startsAt: string) {
  const date = new Date(startsAt);
  const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
  const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${dayName}, ${monthDay} at ${time}`;
}

function isEventExpired(startsAt: string): boolean {
  return new Date(startsAt) < new Date();
}

export function EventInviteCard({
  eventId,
  title,
  location,
  startsAt,
  endsAt,
  status: initialStatus,
  isMe,
  onNavigateToEvent,
}: EventInviteCardProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const expired = isEventExpired(startsAt);
  const effectiveStatus = expired && initialStatus === 'pending' ? 'expired' : initialStatus;

  const rsvpMutation = useMutation({
    mutationFn: async () => (await eventsApi.rsvp(eventId)).data,
    onSuccess: () => {
      void invalidateEventSurfaces(queryClient);
    },
  });

  const accepted = effectiveStatus === 'accepted' || rsvpMutation.isSuccess;

  return (
    <Card
      variant="elevated"
      style={[
        styles.card,
        isMe ? styles.cardMe : styles.cardThem,
      ]}
      onPress={onNavigateToEvent ? () => onNavigateToEvent(eventId) : undefined}
      testID="event-invite-card"
    >
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: theme.primarySubtle }]}>
          <AppIcon name="calendar" size={12} color={theme.primary} />
          <Text style={[styles.badgeText, { color: theme.primary }]}>EVENT INVITE</Text>
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <AppIcon name="clock" size={13} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {formatInviteDate(startsAt)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <AppIcon name="map-pin" size={13} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>

        {accepted ? (
          <View style={[styles.statusPill, { backgroundColor: theme.primarySubtle }]}>
            <AppIcon name="check" size={14} color={theme.primary} />
            <Text style={[styles.statusText, { color: theme.primary }]}>Going</Text>
          </View>
        ) : effectiveStatus === 'expired' ? (
          <View style={[styles.statusPill, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.statusText, { color: theme.textMuted }]}>Event passed</Text>
          </View>
        ) : !isMe ? (
          <Button
            label={rsvpMutation.isPending ? 'Joining...' : 'RSVP'}
            onPress={() => { void rsvpMutation.mutateAsync(); }}
            disabled={rsvpMutation.isPending}
            loading={rsvpMutation.isPending}
            variant="energy"
            size="sm"
            testID="event-invite-rsvp-button"
          />
        ) : (
          <View style={[styles.statusPill, { backgroundColor: theme.surfaceElevated }]}>
            <Text style={[styles.statusText, { color: theme.textMuted }]}>Invite sent</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    maxWidth: '88%',
    marginBottom: spacing.sm,
    borderRadius: 18,
    padding: 0,
  },
  cardMe: {
    alignSelf: 'flex-end',
  },
  cardThem: {
    alignSelf: 'flex-start',
  },
  content: {
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  meta: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginTop: 2,
  },
  statusText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
