import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../store/authStore";
import client from "../api/client";
import { normalizeApiError } from "../api/errors";
import type { User } from "../api/types";
import { buildInfo } from "../config/buildInfo";
import AppState from "../components/ui/AppState";
import { radii, spacing, typography } from "../theme/tokens";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const BASE = "#0D1117";
const SURFACE = "#161B22";
const SURFACE_ELEVATED = "#1C2128";
const BORDER = "rgba(255,255,255,0.07)";
const PRIMARY = "#7C6AF7";
const ACCENT = "#34D399";
const ENERGY = "#F59E0B";
const DANGER = "#F87171";
const TEXT_PRIMARY = "#F0F6FC";
const TEXT_SECONDARY = "rgba(240,246,252,0.6)";
const TEXT_MUTED = "rgba(240,246,252,0.35)";

// ─── Activity Data ────────────────────────────────────────────────────────────
const ACTIVITY_OPTIONS = [
  { label: "🏃 Running", value: "Running", color: ACCENT },
  { label: "🧘 Yoga", value: "Yoga", color: PRIMARY },
  { label: "🏋️ Lifting", value: "Lifting", color: "#F87171" },
  { label: "🥾 Hiking", value: "Hiking", color: ENERGY },
  { label: "🏖️ Beach", value: "Beach", color: "#60A5FA" },
  { label: "🚴 Cycling", value: "Cycling", color: ACCENT },
  { label: "🏄 Surfing", value: "Surfing", color: "#38BDF8" },
  { label: "🧗 Climbing", value: "Climbing", color: "#FB923C" },
  { label: "🥊 Boxing", value: "Boxing", color: "#F87171" },
  { label: "🏊 Swimming", value: "Swimming", color: "#60A5FA" },
  { label: "🎾 Tennis", value: "Tennis", color: ENERGY },
  { label: "⛷️ Skiing", value: "Skiing", color: "#93C5FD" },
];

const SCHEDULE_OPTIONS = [
  "Morning",
  "Midday",
  "Afternoon",
  "Evening",
  "Weekends",
];
const ENVIRONMENT_OPTIONS = ["Outdoors", "Gym", "Home", "Studio", "Pool"];

const ACTIVITY_LABEL_LOOKUP = new Map(
  ACTIVITY_OPTIONS.flatMap(({ label, value }) => {
    const normalized = label.replace(/^[^\p{L}\p{N}]+/u, "").trim();
    return [
      [value.toLowerCase(), value],
      [label.toLowerCase(), value],
      [normalized.toLowerCase(), value],
    ];
  }),
);

function normalizeActivityValue(activity: string) {
  const normalized = activity.trim();
  if (!normalized) {
    return null;
  }

  return ACTIVITY_LABEL_LOOKUP.get(normalized.toLowerCase()) ?? normalized;
}

function parseFavoriteActivities(favoriteActivities?: string | null) {
  return (favoriteActivities ?? "")
    .split(",")
    .map((activity) => normalizeActivityValue(activity))
    .filter((activity): activity is string => Boolean(activity));
}

function buildSchedulePreferences(profile?: User["fitnessProfile"]) {
  const nextSchedule: string[] = [];

  if (profile?.prefersMorning) {
    nextSchedule.push("Morning");
  }
  if (profile?.prefersEvening) {
    nextSchedule.push("Evening");
  }

  return nextSchedule;
}

// ─── Tag Cloud Pill ───────────────────────────────────────────────────────────
function TagPill({
  label,
  selected,
  onPress,
  color = PRIMARY,
  interactive = true,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  interactive?: boolean;
}) {
  return (
    <Pressable
      onPress={interactive ? onPress : undefined}
      style={[
        styles.tagPill,
        selected
          ? { backgroundColor: color + "22", borderColor: color + "70" }
          : { backgroundColor: "rgba(255,255,255,0.04)", borderColor: BORDER },
      ]}
    >
      <Text
        style={[styles.tagPillText, { color: selected ? color : TEXT_MUTED }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Editable Field ───────────────────────────────────────────────────────────
function EditableField({
  label,
  value,
  onChangeText,
  placeholder,
  editMode,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  editMode: boolean;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editMode ? (
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={TEXT_MUTED}
          autoCapitalize="none"
        />
      ) : (
        <Text
          style={[
            styles.fieldValue,
            { color: value ? TEXT_PRIMARY : TEXT_MUTED },
          ]}
        >
          {value || placeholder}
        </Text>
      )}
    </View>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────
function SettingsRow({
  icon,
  label,
  onPress,
  accessory = "›",
  testID,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  accessory?: string;
  testID?: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsArrow}>{accessory}</Text>
    </TouchableOpacity>
  );
}

function BuildInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.buildInfoRow}>
      <Text style={styles.buildInfoLabel}>{label}</Text>
      <Text selectable style={styles.buildInfoValue}>
        {value}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const navigation = useNavigation<any>();

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showBuildInfo, setShowBuildInfo] = useState(false);

  const [intensityLevel, setIntensityLevel] = useState("");
  const [weeklyFrequencyBand, setWeeklyFrequencyBand] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");

  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string[]>([
    "Outdoors",
    "Gym",
  ]);

  useEffect(() => {
    if (user) fetchProfile();
    else setLoading(false);
  }, [user]);

  const fetchProfile = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await client.get<User>("/profile");
      const next = response.data;
      setProfile(next);
      setIntensityLevel(next.fitnessProfile?.intensityLevel || "");
      setWeeklyFrequencyBand(next.fitnessProfile?.weeklyFrequencyBand || "");
      setPrimaryGoal(next.fitnessProfile?.primaryGoal || "");
      setSelectedActivities(
        parseFavoriteActivities(next.fitnessProfile?.favoriteActivities),
      );
      setSelectedSchedule(buildSchedulePreferences(next.fitnessProfile));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  const saveFitness = async () => {
    setSaving(true);
    setError(null);
    try {
      await client.put("/profile/fitness", {
        intensityLevel,
        weeklyFrequencyBand,
        primaryGoal,
        favoriteActivities: selectedActivities.join(", "),
        prefersMorning: selectedSchedule.includes("Morning"),
        prefersEvening: selectedSchedule.includes("Evening"),
      });
      setEditMode(false);
      await fetchProfile(true);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (arr: string[], val: string, set: (a: string[]) => void) => {
    set(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const confirmDeleteAccount = () => {
    if (deletingAccount) {
      return;
    }

    Alert.alert(
      "Delete account?",
      "This permanently removes your profile, matches, messages, event RSVPs, and saved session.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            setError(null);
            try {
              await deleteAccount();
            } catch (err) {
              setError(normalizeApiError(err).message);
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  if (loading) return <AppState title="Loading your profile" loading />;
  if (error && !profile)
    return (
      <AppState
        title="Couldn't load profile"
        description={error}
        actionLabel="Retry"
        onAction={fetchProfile}
        isError
      />
    );
  if (!profile)
    return (
      <AppState
        title="No profile found"
        actionLabel="Refresh"
        onAction={fetchProfile}
      />
    );

  const primaryPhoto =
    profile.photos?.find((p) => p.isPrimary)?.storageKey || profile.photoUrl;
  const buildRows = [
    { label: "App env", value: buildInfo.appEnv },
    {
      label: "Version",
      value: `${buildInfo.version} (${buildInfo.iosBuildNumber})`,
    },
    { label: "Branch", value: buildInfo.gitBranch },
    { label: "Git SHA", value: buildInfo.gitSha },
    { label: "API URL", value: buildInfo.apiBaseUrl || "not set" },
    { label: "Built at", value: buildInfo.buildDate },
    { label: "Release path", value: buildInfo.releaseMode },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Full-bleed violet glow behind avatar */}
      <View style={styles.heroBg} pointerEvents="none" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProfile(true)}
            tintColor={PRIMARY}
          />
        }
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          {/* Avatar with glow ring */}
          <View style={styles.avatarGlowWrap}>
            <LinearGradient
              colors={[PRIMARY, ACCENT]}
              style={styles.avatarGlowRing}
            >
              <View style={styles.avatarInnerWrap}>
                <Image
                  source={
                    primaryPhoto
                      ? { uri: primaryPhoto }
                      : require("../../assets/icon.png")
                  }
                  style={styles.avatar}
                />
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.heroName}>
            {profile.firstName}
            {profile.age ? `, ${profile.age}` : ""}
          </Text>

          <View style={styles.intentBadge}>
            <Text style={styles.intentBadgeText}>🏃 Active Mover</Text>
          </View>

          <Text style={styles.heroLocation}>
            📍 {profile.profile?.city || "Location not set"}
          </Text>

          {/* Ambient stat strip — no grid lines, just numbers floating */}
          <View style={styles.ambientStats}>
            <View style={styles.ambientStat}>
              <Text style={[styles.ambientStatNum, { color: PRIMARY }]}>
                12
              </Text>
              <Text style={styles.ambientStatLabel}>matches</Text>
            </View>
            <View style={styles.ambientStatDot} />
            <View style={styles.ambientStat}>
              <Text style={[styles.ambientStatNum, { color: ACCENT }]}>8</Text>
              <Text style={styles.ambientStatLabel}>activities</Text>
            </View>
            <View style={styles.ambientStatDot} />
            <View style={styles.ambientStat}>
              <Text style={[styles.ambientStatNum, { color: ENERGY }]}>5</Text>
              <Text style={styles.ambientStatLabel}>connections</Text>
            </View>
          </View>
        </View>

        {/* ── Edit / Save bar ── */}
        <View style={styles.editBar}>
          <Pressable
            onPress={() => (editMode ? saveFitness() : setEditMode(true))}
            disabled={saving}
            style={styles.editBtnWrap}
          >
            <LinearGradient
              colors={
                editMode
                  ? [PRIMARY, PRIMARY + "AA"]
                  : ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.04)"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.editBtn}
            >
              <Text
                style={[
                  styles.editBtnText,
                  { color: editMode ? "#FFFFFF" : TEXT_SECONDARY },
                ]}
              >
                {saving
                  ? "Saving..."
                  : editMode
                    ? "✓ Save Changes"
                    : "✏️ Edit Profile"}
              </Text>
            </LinearGradient>
          </Pressable>
          {editMode && (
            <Pressable
              onPress={() => setEditMode(false)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          )}
        </View>

        {/* ── Movement Identity — organic tag cloud ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Movement Identity</Text>
          <View style={styles.tagCloud}>
            {ACTIVITY_OPTIONS.map(({ label, value, color }) => (
              <TagPill
                key={value}
                label={label}
                selected={selectedActivities.includes(value)}
                onPress={() =>
                  editMode && toggle(selectedActivities, value, setSelectedActivities)
                }
                color={color}
                interactive={editMode}
              />
            ))}
          </View>
        </View>

        {/* ── Fitness Fields ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Fitness Profile</Text>
          <View style={styles.fieldsCard}>
            <EditableField
              label="Intensity"
              value={intensityLevel}
              onChangeText={setIntensityLevel}
              placeholder="moderate"
              editMode={editMode}
            />
            <View style={styles.fieldDivider} />
            <EditableField
              label="Days / week"
              value={weeklyFrequencyBand}
              onChangeText={setWeeklyFrequencyBand}
              placeholder="3-4"
              editMode={editMode}
            />
            <View style={styles.fieldDivider} />
            <EditableField
              label="Primary goal"
              value={primaryGoal}
              onChangeText={setPrimaryGoal}
              placeholder="health"
              editMode={editMode}
            />
          </View>
        </View>

        {/* ── Schedule ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Schedule</Text>
          <View style={styles.tagCloud}>
            {SCHEDULE_OPTIONS.map((tag) => (
              <TagPill
                key={tag}
                label={tag}
                selected={selectedSchedule.includes(tag)}
                onPress={() =>
                  editMode && toggle(selectedSchedule, tag, setSelectedSchedule)
                }
                color={ACCENT}
                interactive={editMode}
              />
            ))}
          </View>
        </View>

        {/* ── Environment ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Environment</Text>
          <View style={styles.tagCloud}>
            {ENVIRONMENT_OPTIONS.map((tag) => (
              <TagPill
                key={tag}
                label={tag}
                selected={selectedEnvironment.includes(tag)}
                onPress={() =>
                  editMode &&
                  toggle(selectedEnvironment, tag, setSelectedEnvironment)
                }
                color={ENERGY}
                interactive={editMode}
              />
            ))}
          </View>
        </View>

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Settings</Text>
          <View style={styles.settingsCard}>
            <SettingsRow icon="👤" label="Account" onPress={() => {}} />
            <View style={styles.fieldDivider} />
            <SettingsRow icon="🔒" label="Privacy" onPress={() => {}} />
            <View style={styles.fieldDivider} />
            <SettingsRow
              icon="🔔"
              label="Notifications"
              onPress={() => navigation.navigate("Notifications")}
            />
            <View style={styles.fieldDivider} />
            <SettingsRow
              testID="build-provenance-toggle"
              icon="🧾"
              label="Build provenance"
              accessory={showBuildInfo ? "⌄" : "›"}
              onPress={() => setShowBuildInfo((current) => !current)}
            />
            {showBuildInfo ? (
              <>
                <View style={styles.fieldDivider} />
                <View testID="build-provenance-panel" style={styles.buildInfoCard}>
                  {buildRows.map((row, index) => (
                    <View key={row.label}>
                      <BuildInfoRow label={row.label} value={row.value} />
                      {index < buildRows.length - 1 ? (
                        <View style={styles.buildInfoDivider} />
                      ) : null}
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Account deletion</Text>
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete your account</Text>
            <Text style={styles.dangerBody}>
              Remove your BRDG profile and associated data directly from the
              app.
            </Text>
            <Pressable
              onPress={confirmDeleteAccount}
              disabled={deletingAccount}
              style={({ pressed }) => [
                styles.deleteAccountBtn,
                pressed && !deletingAccount
                  ? styles.deleteAccountBtnPressed
                  : null,
                deletingAccount ? styles.deleteAccountBtnDisabled : null,
              ]}
            >
              <Text style={styles.deleteAccountText}>
                {deletingAccount ? "Deleting account..." : "Delete account"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Error banner */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Logout ── */}
        <Pressable
          onPress={logout}
          disabled={deletingAccount}
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>
            {deletingAccount ? "Account deletion in progress" : "Log out"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  heroBg: {
    position: "absolute",
    top: -80,
    left: SCREEN_WIDTH / 2 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: PRIMARY,
    opacity: 0.08,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: 100,
  },

  // Hero
  hero: {
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
  avatarGlowWrap: {
    marginBottom: spacing.lg,
    shadowColor: PRIMARY,
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  avatarGlowRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInnerWrap: {
    width: 98,
    height: 98,
    borderRadius: 49,
    overflow: "hidden",
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: BASE,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  heroName: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  intentBadge: {
    backgroundColor: "rgba(124,106,247,0.15)",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(124,106,247,0.4)",
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.sm,
  },
  intentBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: "800",
    color: PRIMARY,
  },
  heroLocation: {
    fontSize: typography.bodySmall,
    color: TEXT_MUTED,
    marginBottom: spacing.xl,
    fontWeight: "500",
  },

  // Ambient stats (no card, just floating numbers)
  ambientStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  ambientStat: {
    alignItems: "center",
  },
  ambientStatNum: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 36,
  },
  ambientStatLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  ambientStatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
  },

  // Edit bar
  editBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
    alignItems: "center",
  },
  editBtnWrap: {
    flex: 1,
    borderRadius: radii.pill,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
  },
  editBtn: {
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: radii.pill,
  },
  editBtnText: {
    fontSize: typography.bodySmall,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cancelBtnText: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
    color: TEXT_MUTED,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: TEXT_MUTED,
    marginBottom: spacing.md,
  },

  // Tag cloud — variable gap for organic feel
  tagCloud: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Fitness fields card
  fieldsCard: {
    backgroundColor: SURFACE_ELEVATED,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
    width: 100,
    color: TEXT_MUTED,
    textTransform: "capitalize",
  },
  fieldValue: {
    flex: 1,
    fontSize: typography.bodySmall,
    fontWeight: "600",
    textTransform: "capitalize",
    color: TEXT_PRIMARY,
  },
  fieldInput: {
    flex: 1,
    fontSize: typography.bodySmall,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderColor: "rgba(124,106,247,0.4)",
    backgroundColor: "rgba(124,106,247,0.08)",
    color: TEXT_PRIMARY,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: BORDER,
  },

  // Settings card
  settingsCard: {
    backgroundColor: SURFACE_ELEVATED,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: spacing.md,
  },
  settingsIcon: {
    fontSize: 18,
    width: 24,
    textAlign: "center",
  },
  settingsLabel: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700",
    color: TEXT_PRIMARY,
  },
  settingsArrow: {
    fontSize: 22,
    fontWeight: "300",
    color: TEXT_MUTED,
  },
  buildInfoCard: {
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  buildInfoRow: {
    gap: 4,
    paddingVertical: spacing.sm,
  },
  buildInfoLabel: {
    fontSize: typography.bodySmall,
    fontWeight: "700",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  buildInfoValue: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    fontWeight: "600",
  },
  buildInfoDivider: {
    height: 1,
    backgroundColor: BORDER,
  },
  dangerCard: {
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.28)",
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.md,
  },
  dangerTitle: {
    fontSize: typography.body,
    fontWeight: "800",
    color: TEXT_PRIMARY,
  },
  dangerBody: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
    color: TEXT_SECONDARY,
  },
  deleteAccountBtn: {
    minHeight: 46,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DANGER,
  },
  deleteAccountBtnPressed: {
    opacity: 0.88,
  },
  deleteAccountBtnDisabled: {
    opacity: 0.6,
  },
  deleteAccountText: {
    fontSize: typography.bodySmall,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Error banner
  errorBanner: {
    marginHorizontal: spacing.xxl,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: "rgba(248,113,113,0.1)",
    borderColor: "rgba(248,113,113,0.3)",
  },
  errorText: {
    fontSize: typography.bodySmall,
    fontWeight: "600",
    color: DANGER,
  },

  // Logout
  logoutBtn: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginTop: spacing.sm,
  },
  logoutText: {
    fontSize: typography.body,
    fontWeight: "800",
    color: DANGER,
    letterSpacing: 0.2,
  },
});
