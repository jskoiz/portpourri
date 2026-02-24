import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eventsApi } from '../services/api';
import { normalizeApiError } from '../api/errors';
import type { EventDetail } from '../api/types';
import AppState from '../components/ui/AppState';
import AppButton from '../components/ui/AppButton';
import AppBackButton from '../components/ui/AppBackButton';
import { colors, radii, spacing, typography } from '../theme/tokens';

function formatDateRange(startsAt: string, endsAt?: string | null) {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const date = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const startTime = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const endTime = end ? end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : null;
  return endTime ? `${date} • ${startTime} - ${endTime}` : `${date} • ${startTime}`;
}

export default function EventDetailScreen({ route, navigation }: any) {
  const eventId = route.params?.eventId as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const fetchEvent = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await eventsApi.detail(eventId);
      setEvent(response.data);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const handleJoin = async () => {
    if (!event || joining || event.joined) return;
    setJoining(true);
    const prev = event;
    setEvent({ ...event, joined: true, attendeesCount: event.attendeesCount + 1 });
    try {
      const response = await eventsApi.rsvp(event.id);
      setEvent((current) => (current ? { ...current, joined: true, attendeesCount: response.data.attendeesCount } : current));
    } catch {
      setEvent(prev);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <AppState title="Loading event" loading />;
  if (error || !event) return <AppState title="Couldn’t load event" description={error ?? 'Event not found'} actionLabel="Try again" onAction={fetchEvent} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppBackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.time}>{formatDateRange(event.startsAt, event.endsAt)}</Text>

        {event.imageUrl ? <Image source={{ uri: event.imageUrl }} style={styles.image} /> : null}

        <View style={styles.metaCard}>
          <Text style={styles.metaRow}>📍 {event.location}</Text>
          <Text style={styles.metaRow}>👤 Host: {event.host.firstName}</Text>
          <Text style={styles.metaRow}>🙌 {event.attendeesCount} attending</Text>
          {event.description ? <Text style={styles.description}>{event.description}</Text> : null}
        </View>

        <AppButton
          label={event.joined ? 'Joined' : joining ? 'Joining…' : 'Join event'}
          onPress={handleJoin}
          disabled={event.joined}
          loading={joining}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.md },
  title: { color: colors.textPrimary, fontSize: typography.h1, fontWeight: '800' },
  time: { color: colors.textSecondary },
  image: { width: '100%', height: 220, borderRadius: radii.xl, marginTop: spacing.sm },
  metaCard: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  metaRow: { color: colors.textPrimary, fontSize: typography.body },
  description: { color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 22 },
});
