import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from '../../../design/primitives';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
  type AppBottomSheetProps,
} from '../../../design/sheets/AppBottomSheet';
import AppIcon from '../../../components/ui/AppIcon';
import { useTheme } from '../../../theme/useTheme';
import { lightTheme, radii, spacing, typography } from '../../../theme/tokens';
import { useMyEvents } from '../../events/hooks/useMyEvents';
import type { EventSummary } from '../../../api/types';

function formatShortDate(startsAt: string) {
  const d = new Date(startsAt);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function SuggestPlanSheet({
  controller,
  onClose,
  onCreateEvent,
  onSelectEvent,
}: {
  controller: Pick<
    AppBottomSheetProps,
    'onChangeIndex' | 'onDismiss' | 'onRequestClose' | 'refObject' | 'visible'
  >;
  onClose: () => void;
  onCreateEvent: () => void;
  onSelectEvent: (event: EventSummary) => void;
}) {
  const theme = useTheme();
  const { events, isLoading } = useMyEvents();
  const futureEvents = events.filter((e) => new Date(e.startsAt) > new Date());

  return (
    <AppBottomSheet
      {...controller}
      title="Suggest a plan"
      subtitle="Invite your match to an event or create something new."
      snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.standard}
    >
      <Pressable
        onPress={() => {
          onClose();
          onCreateEvent();
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        <Card variant="glass" style={styles.createCard}>
          <View style={styles.createContent}>
            <View style={[styles.createIcon, { backgroundColor: theme.primarySubtle }]}>
              <AppIcon name="plus" size={18} color={theme.primary} />
            </View>
            <View style={styles.createCopy}>
              <Text style={[styles.createTitle, { color: theme.textPrimary }]}>Create a new event</Text>
              <Text style={[styles.createSub, { color: theme.textSecondary }]}>Start fresh with a custom plan</Text>
            </View>
          </View>
        </Card>
      </Pressable>

      {futureEvents.length > 0 && (
        <Text style={styles.sectionLabel}>YOUR UPCOMING EVENTS</Text>
      )}

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={styles.loader} />
      ) : (
        futureEvents.map((event) => (
          <Card key={event.id} style={styles.eventCard}>
            <View style={styles.eventBody}>
              <Text style={[styles.eventTitle, { color: theme.textPrimary }]}>{event.title}</Text>
              <View style={styles.eventMeta}>
                <AppIcon name="calendar" size={12} color={theme.textMuted} />
                <Text style={[styles.eventMetaText, { color: theme.textSecondary }]}>
                  {formatShortDate(event.startsAt)}
                </Text>
                <AppIcon name="map-pin" size={12} color={theme.textMuted} />
                <Text style={[styles.eventMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
              <Button
                label="Send invite"
                onPress={() => {
                  onClose();
                  onSelectEvent(event);
                }}
                variant="secondary"
                size="sm"
              />
            </View>
          </Card>
        ))
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: lightTheme.textMuted,
    marginTop: spacing.xs,
  },
  createCard: {
    borderRadius: 18,
  },
  createContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  createIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCopy: {
    flex: 1,
    gap: 2,
  },
  createTitle: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  createSub: {
    fontSize: typography.caption,
    lineHeight: 18,
  },
  eventCard: {
    borderRadius: 18,
  },
  eventBody: {
    gap: spacing.sm,
  },
  eventTitle: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  eventMetaText: {
    fontSize: typography.caption,
  },
  loader: {
    marginVertical: spacing.xl,
  },
});
