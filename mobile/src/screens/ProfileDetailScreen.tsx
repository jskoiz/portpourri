import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { normalizeApiError } from '../api/errors';
import type { RootStackScreenProps } from '../core/navigation/types';
import AppBackButton from '../components/ui/AppBackButton';
import AppIcon from '../components/ui/AppIcon';
import AppBackdrop from '../components/ui/AppBackdrop';
import { Button, Screen, StatePanel } from '../design/primitives';
import { useDiscoveryActions } from '../features/discovery/hooks/useDiscoveryActions';
import { useMatches } from '../features/matches/hooks/useMatches';
import { useSheetController } from '../design/sheets/useSheetController';
import { useTheme } from '../theme/useTheme';
import { lightTheme, radii, spacing, typography } from '../theme/tokens';
import { type SessionIntent } from '../types/sessionIntent';
import { parseFavoriteActivities } from '../lib/profile-helpers';
import { getAvatarInitial, getPrimaryPhotoUri } from '../lib/profilePhotos';
import { ReportSheet } from '../features/moderation/components/ReportSheet';
import { useBlock } from '../features/moderation/hooks/useBlock';
import { showBlockConfirmation } from '../features/moderation/components/BlockConfirmation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_HEIGHT = 420;

// Static references for StyleSheet (module-level); components use useTheme() for reactivity
const BASE = lightTheme.background;
const SURFACE = lightTheme.surface;
const PRIMARY = lightTheme.primary;
const ACCENT = lightTheme.success;
const BORDER = lightTheme.border;
const TEXT_PRIMARY = lightTheme.textPrimary;
const TEXT_MUTED = lightTheme.textMuted;

export default function ProfileDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'ProfileDetail'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = route.params;
  const { matches } = useMatches();
  const { passUser, likeUser, isActing } = useDiscoveryActions();
  const submitting = isActing;
  const [menuVisible, setMenuVisible] = useState(false);
  const reportSheet = useSheetController();
  const { block, isLoading: isBlocking } = useBlock({
    onSuccess: () => navigation.goBack(),
  });

  const handleBlock = () => {
    setMenuVisible(false);
    showBlockConfirmation(() => {
      void block({ blockedUserId: user.id });
    });
  };

  const handleReport = () => {
    setMenuVisible(false);
    reportSheet.open();
  };

  if (!user) {
    return (
      <Screen>
        <AppBackButton onPress={() => navigation.goBack()} />
        <StatePanel title="Profile not found" description="This profile is no longer available." />
      </Screen>
    );
  }

  const primaryPhoto = getPrimaryPhotoUri(user);
  const activityTags: string[] = parseFavoriteActivities(user.fitnessProfile?.favoriteActivities);

  const intentFlags = [
    user.profile?.intentDating ? 'Dating' : null,
    user.profile?.intentWorkout ? 'Training partner' : null,
    user.profile?.intentFriends ? 'Friends' : null,
  ].filter(Boolean);

  const intentDisplay = intentFlags.length > 0 ? intentFlags.join(' + ') : null;
  const structuredRows = [
    {
      label: 'Pace',
      value: user.fitnessProfile?.intensityLevel ? `${user.fitnessProfile.intensityLevel}` : 'Not set',
    },
    {
      label: 'Prefers',
      value: activityTags.slice(0, 2).join(' / ') || 'Not set',
    },
    {
      label: 'Intent',
      value: intentDisplay || 'Not set',
    },
  ];

  const handleSuggestActivity = () => {
    const firstActivity = activityTags[0] || 'a workout';
    const suggestion = `Let's plan ${firstActivity} together.`;
    const existingMatch = matches.find((match) => match.user.id === user.id);

    if (!existingMatch) {
      Alert.alert(
        'Match required',
        'Once you both match, you can jump straight into chat with a suggested plan.',
      );
      return;
    }

    navigation.navigate('Chat', {
      matchId: existingMatch.id,
      user: existingMatch.user,
      prefillMessage: suggestion,
    });
  };

  const handlePass = async () => {
    try {
      await passUser(user.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not pass profile', normalizeApiError(error).message);
    }
  };

  const handleLike = async () => {
    try {
      await likeUser(user.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not like profile', normalizeApiError(error).message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppBackdrop />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          {primaryPhoto ? (
            <Image source={{ uri: primaryPhoto }} style={styles.heroImage} contentFit="cover" accessibilityLabel={`Photo of ${user.firstName || 'profile'}`} />
          ) : (
            <LinearGradient
              colors={['#F7F4F0', '#E8E2DA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroFallback}
            >
              <Text style={styles.heroFallbackText}>{getAvatarInitial(user.firstName)}</Text>
            </LinearGradient>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(253,251,248,0.7)', 'rgba(253,251,248,0.98)']}
            locations={[0, 0.55, 1]}
            style={styles.heroGradient}
          />

          <View style={styles.backButtonOverlay}>
            <AppBackButton onPress={() => navigation.goBack()} style={{ marginBottom: 0 }} />
          </View>

          <View style={styles.overflowButtonOverlay}>
            <Pressable
              onPress={() => setMenuVisible((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="More options"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.overflowButton}
            >
              <AppIcon name="more-vertical" size={18} color={theme.textPrimary} />
            </Pressable>
            {menuVisible && (
              <View style={styles.overflowMenu}>
                <Pressable
                  onPress={handleReport}
                  style={styles.overflowMenuItem}
                  accessibilityRole="menuitem"
                >
                  <AppIcon name="flag" size={16} color={theme.textPrimary} />
                  <Text style={styles.overflowMenuText}>Report</Text>
                </Pressable>
                <Pressable
                  onPress={handleBlock}
                  style={styles.overflowMenuItem}
                  accessibilityRole="menuitem"
                >
                  <AppIcon name="slash" size={16} color={theme.danger} />
                  <Text style={[styles.overflowMenuText, { color: theme.danger }]}>Block</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.heroNameOverlay}>
            {intentDisplay && (
              <View style={styles.intentPill}>
                <Text style={styles.intentPillText}>{intentDisplay}</Text>
              </View>
            )}
            <Text style={styles.heroName}>
              {user.firstName || 'Someone'}{user.age ? `, ${user.age}` : ''}
            </Text>
            <View style={styles.locationRow}>
              <AppIcon name="map-pin" size={14} color={theme.textMuted} />
              <Text style={styles.heroLocation}>
                {user.profile?.city || 'Nearby'}
              </Text>
            </View>

            {activityTags.length > 0 && (
              <View style={styles.tagRow}>
                {activityTags.slice(0, 4).map((tag, index) => (
                  <View key={`${tag}-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.contentArea}>
          {!!user.profile?.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>About</Text>
              <Text style={styles.bio}>{user.profile.bio}</Text>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.metaPanel}>
              {user.fitnessProfile?.weeklyFrequencyBand ? (
                <View style={styles.metaIntroCard}>
                  <Text style={styles.metaIntroText}>
                    Moves {user.fitnessProfile.weeklyFrequencyBand}x per week.
                  </Text>
                </View>
              ) : null}

              {structuredRows.map((row) => (
                <StructuredRow key={row.label} label={row.label} value={row.value} />
              ))}
            </View>
          </View>

          {activityTags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Movement Identity</Text>
              <View style={styles.activityPills}>
                {activityTags.slice(0, 3).map((tag, i) => {
                  const isAccent = i % 2 === 0;
                  return (
                    <View
                      key={tag}
                      style={[
                        styles.activityPill,
                        {
                          backgroundColor: isAccent ? 'rgba(139,170,122,0.10)' : 'rgba(196,168,130,0.10)',
                          borderColor: isAccent ? 'rgba(139,170,122,0.24)' : 'rgba(196,168,130,0.24)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activityPillText,
                          { color: isAccent ? theme.success : theme.primary },
                        ]}
                      >
                        {tag}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <Pressable
            onPress={handleSuggestActivity}
            style={[styles.suggestBtn, { minHeight: 48 }]}
            accessibilityRole="button"
            accessibilityLabel="Suggest an activity"
            accessibilityHint="Opens a chat with a suggested plan"
            disabled={submitting}
          >
            <LinearGradient
              colors={['#D4C9B0', theme.primary]}
              style={styles.suggestBtnInner}
            >
              <Text style={styles.suggestBtnText}>Suggest activity</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>

      <LinearGradient
        colors={['rgba(253,251,248,0)', 'rgba(253,251,248,0.95)', '#FDFBF8']}
        style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, spacing.xxl) }]}
      >
        <View style={styles.actionRow}>
          <Button
            label="Pass"
            variant="secondary"
            onPress={handlePass}
            disabled={submitting}
            style={styles.actionBtn}
          />
          <Button
            label="Like"
            variant="primary"
            onPress={handleLike}
            disabled={submitting}
            loading={submitting}
            style={styles.actionBtnPrimary}
          />
        </View>
      </LinearGradient>

      <ReportSheet
        controller={reportSheet.sheetProps}
        onClose={reportSheet.close}
        reportedUserId={user.id}
      />
    </SafeAreaView>
  );
}

function StructuredRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.structuredRow}>
      <Text style={styles.structuredLabel}>{label}</Text>
      <Text style={styles.structuredValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BASE,
  },
  scrollContent: {
    paddingBottom: 130,
  },

  // Hero
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackText: {
    fontSize: 96,
    fontWeight: '900',
    color: '#7A7068',
    letterSpacing: -4,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.75,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  overflowButtonOverlay: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  overflowButton: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: radii.pill,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: SURFACE,
    borderRadius: radii.lg,
    paddingVertical: spacing.xs,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  overflowMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  overflowMenuText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  heroNameOverlay: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xxl,
    right: spacing.xxl,
  },
  intentPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(196,168,130,0.18)',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.34)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  intentPillText: {
    color: PRIMARY,
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroName: {
    fontSize: 40,
    fontWeight: '900',
    color: '#2C2420',
    letterSpacing: -1,
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  heroLocation: {
    fontSize: typography.bodySmall,
    color: '#7A7068',
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(196,168,130,0.12)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(196,168,130,0.25)',
  },
  tagText: {
    color: '#2C2420',
    fontSize: 11,
    fontWeight: '700',
  },

  // Content
  contentArea: {
    backgroundColor: 'rgba(253,251,248,0.92)',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: spacing.md,
  },
  bio: {
    fontSize: typography.body,
    lineHeight: 28,
    color: TEXT_PRIMARY,
    opacity: 0.88,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaPanel: {
    gap: spacing.sm,
  },
  metaIntroCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    backgroundColor: 'rgba(247,244,240,0.82)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  metaIntroText: {
    color: TEXT_PRIMARY,
    opacity: 0.86,
    lineHeight: 22,
    fontSize: typography.bodySmall,
  },
  activityPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  activityPillText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  structuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E2DA',
    backgroundColor: 'rgba(247,244,240,0.76)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  structuredLabel: {
    color: TEXT_MUTED,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  structuredValue: {
    color: TEXT_PRIMARY,
    fontSize: typography.bodySmall,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Suggest btn
  suggestBtn: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: 120,
    marginTop: spacing.sm,
  },
  suggestBtnInner: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  suggestBtnText: {
    fontSize: typography.body,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 24,
    paddingBottom: spacing.xxl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnPrimary: {
    flex: 2,
  },
});
