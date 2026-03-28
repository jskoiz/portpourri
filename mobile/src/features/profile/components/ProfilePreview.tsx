import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import type { ProfileCompletenessMissingItem, User } from '../../../api/types';
import { ScreenScaffold, screenLayout } from '../../../design/primitives';
import AppIcon from '../../../components/ui/AppIcon';
import { useTheme } from '../../../theme/useTheme';
import { radii, shadows, spacing, typography } from '../../../theme/tokens';
import { fontIntent } from '../../../lib/fonts';
import { getPrimaryPhotoUri, getAvatarInitial } from '../../../lib/profilePhotos';
import {
  getIntentLabels,
  getIntentLabel,
  getTempoLabel,
  getProfileChips,
  parseFavoriteActivities,
  formatProfileLabel,
} from '../../../lib/profile-helpers';
import { PRIMARY_GOAL_OPTIONS, SCHEDULE_OPTIONS } from './profile.helpers';
import type { LocationSuggestion } from '../../locations/locationSuggestions';
import type { PhotoOperationState } from '../hooks/usePhotoManager';

import { ProfilePreviewSection } from './ProfilePreviewSection';
import { ProfilePhotoStrip } from './ProfilePhotoStrip';
import { EditBioSheet } from './sheets/EditBioSheet';
import { EditPhotosSheet } from './sheets/EditPhotosSheet';
import { EditIntentSheet } from './sheets/EditIntentSheet';
import { EditFitnessSheet } from './sheets/EditFitnessSheet';

const SCREEN_WIDTH = Dimensions.get('window').width;

type EditSheetName = 'bio' | 'photos' | 'intent' | 'fitness' | null;

export function ProfilePreview({
  completenessEarned,
  completenessScore,
  completenessMissing,
  completenessTotal,
  bio,
  city,
  discoveryPreference,
  editingPhotos,
  intensityLevel,
  intentDating,
  intentFriends,
  intentWorkout,
  isRefetching,
  isSavingFitness,
  isSavingProfile,
  knownLocationSuggestions,
  onDeletePhoto,
  onMakePrimaryPhoto,
  onMovePhotoLeft,
  onMovePhotoRight,
  onNavigateSettings,
  onRefresh,
  onSaveBio,
  onSaveFitness,
  onSaveIntent,
  onSelectCitySuggestion,
  onSetBio,
  onSetCity,
  onSetIntensityLevel,
  onSetIntentDating,
  onSetIntentFriends,
  onSetIntentWorkout,
  onSetPrimaryGoal,
  onSetSelectedActivities,
  onSetSelectedSchedule,
  onSetWeeklyFrequencyBand,
  onUploadPhoto,
  photoOperation,
  primaryGoal,
  profile,
  selectedActivities,
  selectedSchedule,
  weeklyFrequencyBand,
}: {
  completenessEarned: number;
  completenessScore: number;
  completenessMissing: ProfileCompletenessMissingItem[];
  completenessTotal: number;
  bio: string;
  city: string;
  discoveryPreference: 'men' | 'women' | 'both';
  editingPhotos: boolean;
  intensityLevel: string;
  intentDating: boolean;
  intentFriends: boolean;
  intentWorkout: boolean;
  isRefetching: boolean;
  isSavingFitness: boolean;
  isSavingProfile: boolean;
  knownLocationSuggestions: LocationSuggestion[];
  onDeletePhoto: (photoId: string) => void;
  onMakePrimaryPhoto: (photoId: string) => void;
  onMovePhotoLeft: (photoId: string) => void;
  onMovePhotoRight: (photoId: string) => void;
  onNavigateSettings: () => void;
  onRefresh: () => void;
  onSaveBio: () => Promise<boolean>;
  onSaveFitness: () => Promise<boolean>;
  onSaveIntent: () => Promise<boolean>;
  onSelectCitySuggestion: (suggestion: LocationSuggestion) => void;
  onSetBio: (value: string) => void;
  onSetCity: (value: string) => void;
  onSetIntensityLevel: (value: string) => void;
  onSetIntentDating: (value: boolean) => void;
  onSetIntentFriends: (value: boolean) => void;
  onSetIntentWorkout: (value: boolean) => void;
  onSetPrimaryGoal: (value: string) => void;
  onSetSelectedActivities: (value: string) => void;
  onSetSelectedSchedule: (value: string) => void;
  onSetWeeklyFrequencyBand: (value: string) => void;
  onUploadPhoto: () => void;
  photoOperation: PhotoOperationState;
  primaryGoal: string;
  profile: User;
  selectedActivities: string[];
  selectedSchedule: string[];
  weeklyFrequencyBand: string;
}) {
  const theme = useTheme();
  const [activeSheet, setActiveSheet] = useState<EditSheetName>(null);

  const bioSheetRef = useRef<BottomSheetModal>(null);
  const photosSheetRef = useRef<BottomSheetModal>(null);
  const intentSheetRef = useRef<BottomSheetModal>(null);
  const fitnessSheetRef = useRef<BottomSheetModal>(null);

  const openSheet = useCallback((sheet: EditSheetName) => {
    setActiveSheet(sheet);
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  const primaryPhoto = getPrimaryPhotoUri(profile);
  const primaryGoalLabel = primaryGoal
    ? PRIMARY_GOAL_OPTIONS.find((o) => o.value === primaryGoal)?.label ?? primaryGoal
    : null;
  const intentLabels = getIntentLabels(profile);
  const intentLabel = getIntentLabel(profile);
  const tempoLabel = getTempoLabel(profile);
  const chips = getProfileChips(profile);
  const activities = parseFavoriteActivities(profile.fitnessProfile?.favoriteActivities);
  const scheduleLabels = (() => {
    const labels: string[] = [];
    if (profile.fitnessProfile?.prefersMorning) labels.push('Mornings');
    if (profile.fitnessProfile?.prefersEvening) labels.push('Evenings');
    return labels;
  })();
  const isComplete = completenessScore >= 100;

  return (
    <ScreenScaffold>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.accentPrimary}
          />
        }
      >
        {/* Top action bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onNavigateSettings}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={12}
            style={[styles.topBarButton, { backgroundColor: theme.surfaceElevated }]}
          >
            <AppIcon name="settings" size={20} color={theme.textSecondary} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: theme.textPrimary }]}>Profile</Text>
          <View style={styles.topBarButton} />
        </View>

        {/* Hero — discovery-style card */}
        <Pressable
          onPress={() => openSheet('photos')}
          accessibilityLabel="Edit photos"
          style={styles.heroWrap}
        >
          <View style={[styles.heroCard, { backgroundColor: theme.surfaceElevated }]}>
            {primaryPhoto ? (
              <Image
                source={{ uri: primaryPhoto }}
                style={styles.heroImage}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[theme.accentPrimary, theme.subduedSurface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroImage}
              >
                <Text style={styles.heroFallbackInitial}>
                  {getAvatarInitial(profile.firstName)}
                </Text>
              </LinearGradient>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.52)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroCopy}>
                <Text
                  style={[styles.heroName, { fontFamily: fontIntent.editorialHeadline }]}
                  accessibilityRole="header"
                >
                  {profile.firstName}
                  {profile.age ? `, ${profile.age}` : ''}
                </Text>
                <View style={styles.heroMeta}>
                  {profile.profile?.city ? (
                    <Text style={styles.heroLocation}>
                      {profile.profile.city}
                    </Text>
                  ) : null}
                  {primaryGoalLabel ? (
                    <>
                      {profile.profile?.city ? (
                        <Text style={styles.heroLocationDot}> · </Text>
                      ) : null}
                      <Text style={styles.heroLocation}>{primaryGoalLabel}</Text>
                    </>
                  ) : null}
                </View>
              </View>
            </LinearGradient>
            {/* Edit badge */}
            <View style={[styles.editPhotoBadge, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
              <AppIcon name="camera" size={14} color={theme.textPrimary} />
            </View>
          </View>
        </Pressable>

        {/* Intent pills */}
        {intentLabels.length > 0 ? (
          <Pressable
            onPress={() => openSheet('intent')}
            accessibilityLabel="Edit intent"
            style={styles.intentRow}
          >
            <Text style={[styles.intentLabel, { color: theme.textSecondary }]}>
              {intentLabel}
            </Text>
            <AppIcon name="chevron-right" size={14} color={theme.textMuted} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => openSheet('intent')}
            style={styles.intentRow}
            accessibilityLabel="Set your intent"
          >
            <Text style={[styles.intentLabel, { color: theme.textMuted }]}>
              Tap to set your intent
            </Text>
            <AppIcon name="chevron-right" size={14} color={theme.textMuted} />
          </Pressable>
        )}

        {/* About section */}
        <View style={styles.sectionGutter}>
          <ProfilePreviewSection
            label="About"
            editHint="Edit"
            onPress={() => openSheet('bio')}
          >
            {profile.profile?.bio ? (
              <Text style={[styles.bioText, { color: theme.textPrimary }]}>
                {profile.profile.bio}
              </Text>
            ) : (
              <Text style={[styles.bioText, { color: theme.textMuted }]}>
                Add a bio to let people know who you are
              </Text>
            )}
          </ProfilePreviewSection>
        </View>

        {/* Photo strip */}
        {(profile.photos?.length ?? 0) > 1 ? (
          <View style={styles.photoStripSection}>
            <ProfilePhotoStrip
              photos={profile.photos ?? []}
              onPress={() => openSheet('photos')}
            />
          </View>
        ) : null}

        {/* Movement & Fitness */}
        <View style={styles.sectionGutter}>
          <ProfilePreviewSection
            label="Movement"
            editHint="Edit"
            onPress={() => openSheet('fitness')}
          >
            {/* Activity chips */}
            {activities.length > 0 ? (
              <View style={styles.chipRow}>
                {activities.map((activity) => (
                  <View key={activity} style={[styles.chip, { backgroundColor: theme.chipSurface }]}>
                    <Text style={[styles.chipText, { color: theme.textPrimary }]}>
                      {formatProfileLabel(activity)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Tempo line */}
            {tempoLabel ? (
              <Text style={[styles.tempoText, { color: theme.textSecondary }]}>
                {tempoLabel}
              </Text>
            ) : null}

            {/* Schedule */}
            {scheduleLabels.length > 0 ? (
              <Text style={[styles.scheduleText, { color: theme.textMuted }]}>
                {scheduleLabels.join(' · ')}
              </Text>
            ) : null}

            {activities.length === 0 && !tempoLabel ? (
              <Text style={[styles.bioText, { color: theme.textMuted }]}>
                Add your fitness details
              </Text>
            ) : null}
          </ProfilePreviewSection>
        </View>

        {/* Completeness */}
        {!isComplete ? (
          <View style={styles.sectionGutter}>
            <View style={[styles.completenessCard, { backgroundColor: theme.surfaceElevated }]}>
              <View style={styles.completenessHeader}>
                <Text style={[styles.completenessTitle, { color: theme.textPrimary }]}>
                  Complete your profile
                </Text>
                <Text style={[styles.completenessPercent, { color: theme.accentPrimary }]}>
                  {completenessScore}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: theme.subduedSurface }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(completenessScore, 4)}%`,
                      backgroundColor: theme.accentPrimary,
                    },
                  ]}
                />
              </View>
              {completenessMissing.slice(0, 3).map((item) => (
                <Pressable
                  key={item.field}
                  onPress={() => {
                    if (item.field === 'bio' || item.field === 'city') openSheet('bio');
                    else if (item.field === 'photos') openSheet('photos');
                    else openSheet('fitness');
                  }}
                  style={styles.completenessItem}
                  accessibilityLabel={item.label}
                >
                  <View style={[styles.completenessCheck, { borderColor: theme.stroke }]} />
                  <Text style={[styles.completenessItemText, { color: theme.textSecondary }]}>
                    {item.label}
                  </Text>
                  <AppIcon name="chevron-right" size={12} color={theme.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Edit Sheets */}
      <EditBioSheet
        bio={bio}
        city={city}
        isSaving={isSavingProfile}
        knownLocationSuggestions={knownLocationSuggestions}
        onDismiss={closeSheet}
        onSave={onSaveBio}
        onSelectCitySuggestion={onSelectCitySuggestion}
        onSetBio={onSetBio}
        onSetCity={onSetCity}
        refObject={bioSheetRef}
        visible={activeSheet === 'bio'}
      />
      <EditPhotosSheet
        editingPhotos={editingPhotos}
        onDeletePhoto={onDeletePhoto}
        onDismiss={closeSheet}
        onMakePrimaryPhoto={onMakePrimaryPhoto}
        onMovePhotoLeft={onMovePhotoLeft}
        onMovePhotoRight={onMovePhotoRight}
        onUploadPhoto={onUploadPhoto}
        photoOperation={photoOperation}
        photos={profile.photos ?? []}
        refObject={photosSheetRef}
        visible={activeSheet === 'photos'}
      />
      <EditIntentSheet
        intentDating={intentDating}
        intentFriends={intentFriends}
        intentWorkout={intentWorkout}
        isSaving={isSavingProfile}
        onDismiss={closeSheet}
        onSave={onSaveIntent}
        onSetIntentDating={onSetIntentDating}
        onSetIntentFriends={onSetIntentFriends}
        onSetIntentWorkout={onSetIntentWorkout}
        refObject={intentSheetRef}
        visible={activeSheet === 'intent'}
      />
      <EditFitnessSheet
        intensityLevel={intensityLevel}
        isSaving={isSavingFitness}
        onDismiss={closeSheet}
        onSave={onSaveFitness}
        onSetIntensityLevel={onSetIntensityLevel}
        onSetPrimaryGoal={onSetPrimaryGoal}
        onSetSelectedActivities={onSetSelectedActivities}
        onSetSelectedSchedule={onSetSelectedSchedule}
        onSetWeeklyFrequencyBand={onSetWeeklyFrequencyBand}
        primaryGoal={primaryGoal}
        refObject={fitnessSheetRef}
        selectedActivities={selectedActivities}
        selectedSchedule={selectedSchedule}
        visible={activeSheet === 'fitness'}
        weeklyFrequencyBand={weeklyFrequencyBand}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenLayout.gutter,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  topBarTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroWrap: {
    paddingHorizontal: screenLayout.gutter,
    marginBottom: spacing.lg,
  },
  heroCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroImage: {
    width: '100%',
    height: SCREEN_WIDTH - screenLayout.gutter * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackInitial: {
    fontSize: 84,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.7)',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 80,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  heroCopy: {
    gap: spacing.xs,
  },
  heroName: {
    fontSize: typography.h1,
    fontWeight: '900',
    letterSpacing: -0.8,
    color: '#FFFFFF',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLocation: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
  },
  heroLocationDot: {
    fontSize: typography.bodySmall,
    color: 'rgba(255,255,255,0.6)',
  },
  editPhotoBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  intentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: screenLayout.gutter,
    marginBottom: screenLayout.sectionGap,
  },
  intentLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  sectionGutter: {
    paddingHorizontal: screenLayout.gutter,
    marginBottom: screenLayout.sectionGap,
  },
  bioText: {
    fontSize: typography.body,
    lineHeight: 24,
    fontWeight: '500',
  },
  photoStripSection: {
    marginBottom: screenLayout.sectionGap,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  chipText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
  },
  tempoText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  scheduleText: {
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  completenessCard: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.soft,
    gap: spacing.md,
  },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completenessTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '800',
  },
  completenessPercent: {
    fontSize: typography.bodySmall,
    fontWeight: '900',
  },
  progressTrack: {
    height: 6,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  completenessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  completenessCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  completenessItemText: {
    flex: 1,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
});
