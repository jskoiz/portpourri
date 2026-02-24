import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { discoveryApi, type DiscoveryFiltersInput } from "../services/api";
import SwipeDeck from "../components/SwipeDeck";
import MatchAnimation from "../components/MatchAnimation";
import { normalizeApiError } from "../api/errors";
import type { User } from "../api/types";
import AppState from "../components/ui/AppState";
import { colors, spacing, typography, radii } from "../theme/tokens";

const goalOptions = ["strength", "weight_loss", "endurance", "mobility"];
const intensityOptions = ["low", "moderate", "high"];
const availabilityOptions: Array<"morning" | "evening"> = [
  "morning",
  "evening",
];

export default function HomeScreen({ navigation }: any) {
  const user = useAuthStore((state) => state.user);
  const [feed, setFeed] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<User | null>(null);
  const [matchData, setMatchData] = useState<{ id: string } | null>(null);
  const [completeness, setCompleteness] = useState<{
    score: number;
    prompts: string[];
  } | null>(null);

  const [distanceKm, setDistanceKm] = useState("50");
  const [minAge, setMinAge] = useState("21");
  const [maxAge, setMaxAge] = useState("45");
  const [goals, setGoals] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<string[]>([]);
  const [availability, setAvailability] = useState<
    Array<"morning" | "evening">
  >([]);

  useEffect(() => {
    if (user && !user.isOnboarded) {
      setTimeout(() => navigation.navigate("Onboarding"), 100);
      return;
    }
    fetchFeed();
    fetchCompleteness();
  }, [user]);

  const currentFilters = (): DiscoveryFiltersInput => ({
    distanceKm: Number(distanceKm) || undefined,
    minAge: Number(minAge) || undefined,
    maxAge: Number(maxAge) || undefined,
    goals: goals.length ? goals : undefined,
    intensity: intensity.length ? intensity : undefined,
    availability: availability.length ? availability : undefined,
  });

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await discoveryApi.feed(currentFilters());
      setFeed(response.data || []);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompleteness = async () => {
    try {
      const response = await discoveryApi.profileCompleteness();
      setCompleteness(response.data);
    } catch {
      setCompleteness(null);
    }
  };

  const handleSwipeLeft = async (profile: User) => {
    try {
      await discoveryApi.pass(profile.id);
    } catch {}
  };

  const handleSwipeRight = async (profile: User) => {
    try {
      const response = await discoveryApi.like(profile.id);
      if (response.data.status === "match" && response.data.match) {
        setMatchedProfile(profile);
        setMatchData(response.data.match);
        setShowMatch(true);
      }
    } catch {}
  };

  const handleUndo = async () => {
    try {
      const response = await discoveryApi.undo();
      if (response.data.status === "undone") {
        await fetchFeed();
      }
    } catch {}
  };

  const toggleValue = <T extends string>(
    current: T[],
    value: T,
    setter: (arr: T[]) => void,
  ) => {
    if (current.includes(value)) setter(current.filter((v) => v !== value));
    else setter([...current, value]);
  };

  const handleMatchAnimationFinish = () => {
    setShowMatch(false);
    if (matchedProfile && matchData)
      navigation.navigate("Chat", {
        matchId: matchData.id,
        user: matchedProfile,
      });
    setMatchedProfile(null);
    setMatchData(null);
  };

  if (loading) {
    return (
      <AppState
        title="Tuning your discovery feed"
        description="Pulling in people who match your pace."
        loading
      />
    );
  }

  if (error) {
    return (
      <AppState
        title="Couldn’t load discovery"
        description={error}
        actionLabel="Try again"
        onAction={fetchFeed}
      />
    );
  }

  if (feed.length === 0) {
    return (
      <AppState
        title="No profiles right now"
        description="You’re caught up. Pull again in a bit or check events in Explore."
        actionLabel="Refresh feed"
        onAction={fetchFeed}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Tonight’s deck</Text>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
            Swipe with intention. Tap a card to view full profile details.
          </Text>
        </View>

        {completeness && (
          <View style={styles.completenessCard}>
            <Text style={styles.completenessTitle}>
              Profile completeness: {completeness.score}%
            </Text>
            {completeness.prompts.slice(0, 2).map((prompt) => (
              <Text key={prompt} style={styles.completenessPrompt}>
                • {prompt}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filters</Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              value={distanceKm}
              onChangeText={setDistanceKm}
              placeholder="Distance km"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={minAge}
              onChangeText={setMinAge}
              placeholder="Min age"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={maxAge}
              onChangeText={setMaxAge}
              placeholder="Max age"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.sectionLabel}>Goals</Text>
          <View style={styles.tagWrap}>
            {goalOptions.map((g) => (
              <Tag
                key={g}
                label={g}
                active={goals.includes(g)}
                onPress={() => toggleValue(goals, g, setGoals)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Intensity</Text>
          <View style={styles.tagWrap}>
            {intensityOptions.map((i) => (
              <Tag
                key={i}
                label={i}
                active={intensity.includes(i)}
                onPress={() => toggleValue(intensity, i, setIntensity)}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Availability</Text>
          <View style={styles.tagWrap}>
            {availabilityOptions.map((a) => (
              <Tag
                key={a}
                label={a}
                active={availability.includes(a)}
                onPress={() => toggleValue(availability, a, setAvailability)}
              />
            ))}
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryBtn} onPress={handleUndo}>
              <Text style={styles.secondaryBtnText}>Undo last swipe</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={fetchFeed}>
              <Text style={styles.primaryBtnText}>Apply filters</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <SwipeDeck
            data={feed}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onPress={(profile) =>
              navigation.navigate("ProfileDetail", { user: profile })
            }
          />
        </View>
      </ScrollView>
      <MatchAnimation
        visible={showMatch}
        onFinish={handleMatchAnimationFinish}
      />
    </SafeAreaView>
  );
}

function Tag({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tag, active && styles.tagActive]}
    >
      <Text style={[styles.tagText, active && styles.tagTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 180 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  kicker: {
    color: colors.accentSoft,
    fontSize: typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    fontWeight: "800",
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.h1,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 21,
  },
  completenessCard: {
    marginHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  completenessTitle: { color: colors.textPrimary, fontWeight: "700" },
  completenessPrompt: { color: colors.textSecondary, marginTop: 4 },
  filtersCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  filtersTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  row: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  tagText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  tagTextActive: { color: colors.textPrimary },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: spacing.md },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.textSecondary, fontWeight: "700" },
  primaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.accentSoft,
  },
  primaryBtnText: { color: colors.textPrimary, fontWeight: "800" },
  content: { flex: 1, minHeight: 520, marginTop: spacing.md },
});
