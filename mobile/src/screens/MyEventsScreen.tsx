import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { eventsApi } from '../services/api';
import { normalizeApiError } from '../api/errors';
import type { EventSummary } from '../api/types';
import AppState from '../components/ui/AppState';
import AppBackButton from '../components/ui/AppBackButton';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';

export default function MyEventsScreen({ navigation }: any) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await eventsApi.mine();
      setEvents(response.data || []);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchEvents(); }, []));

  if (loading) return <AppState title="Loading your events" loading />;
  if (error) return <AppState title="Couldn’t load your events" description={error} actionLabel="Try again" onAction={fetchEvents} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {navigation.canGoBack() ? <AppBackButton onPress={() => navigation.goBack()} /> : null}
        <Text style={styles.title}>My Events</Text>
        <Text style={styles.subtitle}>Your joined events, all in one place.</Text>
      </View>

      {!events.length ? (
        <AppState
          title="No joined events yet"
          description="Join events from Explore and they’ll show up here."
          actionLabel="Go to Explore"
          onAction={() => navigation.navigate('Explore')}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, shadows.soft]} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>{new Date(item.startsAt).toLocaleString()}</Text>
              <Text style={styles.cardMeta}>📍 {item.location}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  title: { fontSize: typography.h1, color: colors.textPrimary, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceGlass,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { color: colors.textPrimary, fontWeight: '800', fontSize: typography.body, marginBottom: spacing.xs },
  cardMeta: { color: colors.textSecondary, fontSize: typography.bodySmall },
});
