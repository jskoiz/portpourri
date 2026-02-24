import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import AppState from "../components/ui/AppState";
import client from "../api/client";
import { normalizeApiError } from "../api/errors";
import { colors, spacing, typography } from "../theme/tokens";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const response = await client.get<NotificationItem[]>("/notifications");
      setItems(response.data);
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  const markAllRead = async () => {
    await client.post("/notifications/mark-all-read");
    await load(true);
  };

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <AppState title="Loading notifications" loading />;
  if (error)
    return (
      <AppState
        title="Couldn’t load notifications"
        description={error}
        actionLabel="Retry"
        onAction={() => load()}
      />
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <AppButton
          label="Mark all read"
          variant="ghost"
          onPress={markAllRead}
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <AppState title="All caught up" description="No notifications yet." />
        }
        renderItem={({ item }) => (
          <AppCard
            style={[styles.card, !item.readAt ? styles.unreadCard : undefined]}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.meta}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </AppCard>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.h2,
    fontWeight: "800",
  },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.md },
  unreadCard: { borderColor: colors.primary, borderWidth: 1.2 },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  cardBody: {
    color: colors.textSecondary,
    fontSize: typography.body,
    marginBottom: spacing.sm,
  },
  meta: { color: colors.textMuted, fontSize: typography.caption },
});
