import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../components/ui/AppIcon';
import { Card, ScreenScaffold, screenLayout } from '../design/primitives';
import { useTheme } from '../theme/useTheme';
import { radii, shadows, spacing, typography } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { normalizeApiError } from '../api/errors';
import { triggerErrorHaptic } from '../lib/interaction/feedback';
import { showToast } from '../store/toastStore';
import {
  isHapticsEnabled,
  loadHapticsPreference,
  setHapticsEnabled,
} from '../lib/interaction/feedback';
import { buildInfo } from '../config/buildInfo';
import { useResolvedBuildDisplayInfo } from '../config/buildDisplayInfo';
import { useProfileEditor } from '../features/profile/hooks/useProfileEditor';
import { useProfile } from '../features/profile/hooks/useProfile';
import { useCurrentOtaInfo } from '../core/updates/otaInfo';
import {
  DISCOVERY_PREFERENCE_OPTIONS,
} from '../features/profile/components/profile.helpers';
import type { RootStackScreenProps } from '../core/navigation/types';

function formatGitReference(value: string) {
  return /^[0-9a-f]{7,40}$/i.test(value) ? value.slice(0, 7) : value;
}

export default function SettingsScreen({
  navigation,
}: RootStackScreenProps<'Settings'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);
  const [showBuildInfo, setShowBuildInfo] = useState(false);
  const otaInfo = useCurrentOtaInfo();
  const resolvedBuildInfo = useResolvedBuildDisplayInfo();

  const { profile, updateProfile } = useProfile();
  const editor = useProfileEditor({
    profile: profile ?? null,
    updateFitness: async () => {},
    updateProfile,
  });
  const buildRows = [
    {
      label: 'Version',
      value: `${resolvedBuildInfo.version} (${resolvedBuildInfo.iosBuildNumber})`,
    },
    { label: 'App env', value: resolvedBuildInfo.appEnv },
    { label: 'API URL', value: resolvedBuildInfo.apiBaseUrl || 'not set' },
    { label: 'Update source', value: otaInfo.launchSourceLabel },
    ...(otaInfo.channel ? [{ label: 'Channel', value: otaInfo.channel }] : []),
    ...(otaInfo.runtimeVersion
      ? [{ label: 'Runtime', value: otaInfo.runtimeVersion }]
      : []),
    ...(otaInfo.updateId ? [{ label: 'Update ID', value: otaInfo.updateId }] : []),
    { label: 'Update published', value: otaInfo.publishedSummary },
    ...(otaInfo.launchSource === 'downloaded'
      ? [{ label: 'Update received', value: otaInfo.firstSeenSummary }]
      : []),
    ...(resolvedBuildInfo.binaryGitSha !== 'unknown'
      ? [{ label: 'Shipped commit', value: formatGitReference(resolvedBuildInfo.binaryGitSha) }]
      : []),
    ...(resolvedBuildInfo.binaryBuiltAt !== 'unknown'
      ? [{ label: 'Shipped at', value: resolvedBuildInfo.binaryBuiltAt }]
      : []),
    ...(otaInfo.launchSource === 'downloaded' &&
    buildInfo.gitSha !== 'unknown' &&
    (resolvedBuildInfo.binaryGitSha === 'unknown' ||
      resolvedBuildInfo.binaryGitSha !== buildInfo.gitSha)
      ? [{ label: 'Current bundle', value: formatGitReference(buildInfo.gitSha) }]
      : []),
  ];

  useEffect(() => {
    loadHapticsPreference().then(setHapticsOn).catch(() => {});
  }, []);

  const handleToggleHaptics = useCallback((enabled: boolean) => {
    setHapticsOn(enabled);
    void setHapticsEnabled(enabled);
  }, []);

  const handleDeleteAccount = useCallback(() => {
    if (deletingAccount) return;
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, matches, messages, event RSVPs, and saved session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await deleteAccount();
            } catch (err) {
              void triggerErrorHaptic();
              Alert.alert('Error', normalizeApiError(err).message);
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  }, [deleteAccount, deletingAccount]);

  return (
    <ScreenScaffold edges={['bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          style={[styles.backButton, { backgroundColor: theme.surfaceElevated }]}
        >
          <AppIcon name="arrow-left" size={20} color={theme.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Discovery Preferences */}
        <View style={styles.sectionGutter}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Discovery</Text>
          <Card style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
            {DISCOVERY_PREFERENCE_OPTIONS.map((option, index) => {
              const selected = editor.discoveryPreference === option.value;
              return (
                <React.Fragment key={option.value}>
                  {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.stroke }]} /> : null}
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => {
                      editor.setDiscoveryPreference(option.value);
                      updateProfile({
                        showMeMen: option.value === 'men' || option.value === 'both',
                        showMeWomen: option.value === 'women' || option.value === 'both',
                      }).catch((err) => {
                        void triggerErrorHaptic();
                        showToast(normalizeApiError(err).message, 'error');
                      });
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{option.label}</Text>
                    {selected ? (
                      <AppIcon name="check" size={18} color={theme.accentPrimary} />
                    ) : null}
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </Card>
        </View>

        {/* General */}
        <View style={styles.sectionGutter}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>General</Text>
          <Card style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <AppIcon name="bell" size={18} color={theme.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary, flex: 1 }]}>Notifications</Text>
              <AppIcon name="chevron-right" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.stroke }]} />

            <View style={styles.row}>
              <AppIcon name="smartphone" size={18} color={theme.textSecondary} />
              <Text style={[styles.rowLabel, { color: theme.textPrimary, flex: 1 }]}>Haptic Feedback</Text>
              <Switch
                value={hapticsOn}
                onValueChange={handleToggleHaptics}
                trackColor={{ false: theme.chipSurface, true: theme.selectedFill }}
                thumbColor={theme.selectedText}
              />
            </View>
          </Card>
        </View>

        {/* Account */}
        <View style={styles.sectionGutter}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Account</Text>
          <Card style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
            <TouchableOpacity
              style={styles.row}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <AppIcon name="trash-2" size={18} color={theme.danger} />
              <Text style={[styles.rowLabel, { color: theme.danger }]}>
                {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Build Info */}
        <View style={styles.sectionGutter}>
          <TouchableOpacity onPress={() => setShowBuildInfo((v) => !v)} activeOpacity={0.7}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>
              {otaInfo.headerLabel} {showBuildInfo ? '▾' : '›'}
            </Text>
          </TouchableOpacity>
          {showBuildInfo ? (
            <Card style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
              {buildRows.map((row, index, arr) => (
                <React.Fragment key={row.label}>
                  <View style={styles.buildRow}>
                    <Text style={[styles.buildLabel, { color: theme.textMuted }]}>{row.label}</Text>
                    <Text selectable style={[styles.buildValue, { color: theme.textPrimary }]}>
                      {row.value}
                    </Text>
                  </View>
                  {index < arr.length - 1 ? (
                    <View style={[styles.divider, { backgroundColor: theme.stroke }]} />
                  ) : null}
                </React.Fragment>
              ))}
            </Card>
          ) : null}
        </View>

        {/* Logout */}
        <Pressable
          onPress={() => { void logout(); }}
          style={styles.logoutButton}
          accessibilityRole="button"
        >
          <Text style={[styles.logoutText, { color: theme.danger }]}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenLayout.gutter,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  headerTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  sectionGutter: {
    paddingHorizontal: screenLayout.gutter,
    marginBottom: screenLayout.sectionGap,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: radii.lg,
    ...shadows.soft,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  buildRow: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  buildLabel: {
    fontSize: typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  buildValue: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    lineHeight: 20,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.sm,
  },
  logoutText: {
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
