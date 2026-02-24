import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';
import { eventsApi } from '../services/api';
import { normalizeApiError } from '../api/errors';
import type { EventSummary } from '../api/types';
import AppState from '../components/ui/AppState';

function formatDate(startsAt: string) {
  return new Date(startsAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ExploreScreen({ navigation }: any) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await eventsApi.list();
      setEvents(response.data || []);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchEvents(); }, []));

  const renderItem = ({ item }: { item: EventSummary }) => (
    <TouchableOpacity style={[styles.card, shadows.medium]} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : <View style={[styles.image, styles.imageFallback]} />}
      <View style={styles.overlay}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardLocation}>📍 {item.location}</Text>
        <Text style={styles.cardTime}>🕒 {formatDate(item.startsAt)}</Text>
      </View>
      {!!item.category && (
        <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Curated events</Text>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Find your next session and tap in.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyEvents')}>
          <Text style={styles.myEventsLink}>View My Events →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <AppState title="Loading events" loading />
      ) : error ? (
        <AppState title="Couldn’t load events" description={error} actionLabel="Try again" onAction={fetchEvents} />
      ) : events.length === 0 ? (
        <AppState title="No events yet" description="New activities will appear here soon." actionLabel="Refresh" onAction={() => fetchEvents(true)} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} tintColor={colors.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  kicker: { color: colors.accentSoft, fontSize: typography.caption, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700' },
  title: { fontSize: typography.h1, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  myEventsLink: { color: colors.primary, marginTop: spacing.sm, fontWeight: '700' },
  list: { padding: spacing.xl },
  card: { height: 220, marginBottom: spacing.lg, borderRadius: radii.xl, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  image: { width: '100%', height: '100%', opacity: 0.88 },
  imageFallback: { backgroundColor: colors.surfaceElevated },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, backgroundColor: 'rgba(5,7,13,0.58)' },
  badge: { position: 'absolute', top: spacing.md, right: spacing.md, backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { color: colors.black, fontWeight: '800', fontSize: typography.caption },
  cardTitle: { fontSize: typography.h3, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.xs },
  cardLocation: { fontSize: typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  cardTime: { fontSize: typography.bodySmall, color: colors.accentSoft, fontWeight: '700' },
});
