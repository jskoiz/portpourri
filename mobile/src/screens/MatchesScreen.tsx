import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { matchesApi } from '../services/api';
import { normalizeApiError } from '../api/errors';
import type { Match } from '../api/types';
import AppState from '../components/ui/AppState';
import { colors, radii, shadows, spacing, typography } from '../theme/tokens';

export default function MatchesScreen() {
  const navigation = useNavigation<any>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await matchesApi.list();
      setMatches(response.data || []);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchMatches(); }, []));

  const renderItem = ({ item }: { item: Match }) => (
    <TouchableOpacity style={[styles.matchItem, shadows.soft]} onPress={() => navigation.navigate('Chat', { matchId: item.id, user: item.user } as any)}>
      {item.user.photoUrl ? (
        <Image source={{ uri: item.user.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{item.user.firstName?.[0] || '?'}</Text>
        </View>
      )}
      <View style={styles.matchInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.user.firstName || 'Match'}</Text>
          <View style={styles.unreadDot} />
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage || 'Start the vibe with a simple “hey 👋”'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Inbox</Text>
      <Text style={styles.subtitle}>Your active matches and conversations.</Text>

      {loading ? (
        <AppState title="Loading conversations" loading />
      ) : error ? (
        <AppState title="Couldn’t load inbox" description={error} actionLabel="Try again" onAction={fetchMatches} />
      ) : matches.length === 0 ? (
        <AppState title="No matches yet" description="Keep swiping in Discover to start new conversations." actionLabel="Go to Discover" onAction={() => navigation.navigate('Discover')} />
      ) : (
        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchMatches(true)} tintColor={colors.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  title: { fontSize: typography.h1, fontWeight: '800', color: colors.textPrimary },
  subtitle: { color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  list: { paddingBottom: spacing.xl },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: spacing.md, backgroundColor: colors.surfaceElevated },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.textPrimary, fontSize: typography.h3, fontWeight: '700' },
  matchInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  name: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '800' },
  lastMessage: { color: colors.textSecondary, fontSize: typography.bodySmall },
});
