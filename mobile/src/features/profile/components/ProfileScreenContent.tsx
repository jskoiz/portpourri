import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, RefreshControl, ScrollView, Switch, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildInfo } from '../../../config/buildInfo';
import type { ProfileCompletenessMissingItem, User } from '../../../api/types';
import { LocationField } from '../../../components/form/LocationField';
import { SheetSelectField } from '../../../components/form/SheetSelectField';
import { Button, Card } from '../../../design/primitives';
import { CompletenessBar } from './CompletenessBar';
import { profileStyles as styles } from './profile.styles';
import {
  ACTIVITY_OPTIONS,
  INTENSITY_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SCHEDULE_OPTIONS,
  WEEKLY_FREQUENCY_OPTIONS,
} from './profile.helpers';
import { EditableField, PhotoManager, TagPill } from './ProfileSections';
import type { PhotoOperationState } from '../hooks/usePhotoManager';
import { getAvatarInitial, getPrimaryPhotoUri } from '../../../lib/profilePhotos';
import {
  isHapticsEnabled,
  loadHapticsPreference,
  setHapticsEnabled,
  triggerLightImpactHaptic,
} from '../../../lib/interaction/feedback';
import type { LocationSuggestion } from '../../locations/locationSuggestions';

function SettingsRow({
  accessory = '›',
  accessibilityHint,
  accessibilityState,
  icon,
  label,
  onPress,
  testID,
}: {
  accessory?: string;
  accessibilityHint?: string;
  accessibilityState?: Record<string, boolean | undefined>;
  icon: string;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [
        styles.settingsRow,
        {
          minHeight: 52,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
      onPress={() => {
        void triggerLightImpactHaptic();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint ?? `Opens ${label.toLowerCase()} settings`}
      accessibilityState={accessibilityState}
      hitSlop={8}
    >
      <Text style={styles.settingsIcon} importantForAccessibility="no">{icon}</Text>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsArrow} importantForAccessibility="no">{accessory}</Text>
    </Pressable>
  );
}

function SettingsToggleRow({
  icon,
  label,
  onValueChange,
  testID,
  value,
}: {
  icon: string;
  label: string;
  onValueChange: (value: boolean) => void;
  testID?: string;
  value: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      style={({ pressed }) => [
        styles.settingsRow,
        {
          minHeight: 52,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
      onPress={() => {
        void triggerLightImpactHaptic();
        onValueChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      accessibilityHint="Double tap to toggle"
      hitSlop={8}
    >
      <Text style={styles.settingsIcon} importantForAccessibility="no">{icon}</Text>
      <Text style={styles.settingsLabel}>{label}</Text>
      <View pointerEvents="none" accessible={false} importantForAccessibility="no">
        <Switch
          testID={testID ? `${testID}-switch` : undefined}
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E0D8CF', true: '#C4A882' }}
          thumbColor="#FFFFFF"
          importantForAccessibility="no"
        />
      </View>
    </Pressable>
  );
}

function BuildInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.buildInfoRow}>
      <Text style={styles.buildInfoLabel}>{label}</Text>
      <Text selectable style={styles.buildInfoValue}>{value}</Text>
    </View>
  );
}

export function ProfileScreenContent({
  completenessScore,
  completenessMissing,
  deletingAccount,
  editingPhotos,
  bio,
  city,
  editMode,
  errorMessage,
  intensityLevel,
  intentDating,
  intentFriends,
  intentWorkout,
  isRefetching,
  isSavingProfile,
  isSavingFitness,
  knownLocationSuggestions,
  navigation,
  onCancelEdit,
  onConfirmDeleteAccount,
  onDeletePhoto,
  onMakePrimaryPhoto,
  onMovePhotoLeft,
  onMovePhotoRight,
  onRefresh,
  onLogout,
  onSave,
  onSetBio,
  onSetCity,
  onSelectCitySuggestion,
  onSetIntensityLevel,
  onSetIntentDating,
  onSetIntentFriends,
  onSetIntentWorkout,
  onSetPrimaryGoal,
  onSetSelectedActivities,
  onSetSelectedSchedule,
  onSetWeeklyFrequencyBand,
  onToggleBuildInfo,
  onUploadPhoto,
  photoOperation,
  primaryGoal,
  profile,
  selectedActivities,
  selectedSchedule,
  showBuildInfo,
  weeklyFrequencyBand,
}: {
  completenessScore: number;
  completenessMissing: ProfileCompletenessMissingItem[];
  deletingAccount: boolean;
  editingPhotos: boolean;
  bio: string;
  city: string;
  editMode: boolean;
  errorMessage: string | null;
  intensityLevel: string;
  intentDating: boolean;
  intentFriends: boolean;
  intentWorkout: boolean;
  isRefetching: boolean;
  isSavingProfile: boolean;
  isSavingFitness: boolean;
  knownLocationSuggestions: LocationSuggestion[];
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
  onCancelEdit: () => void;
  onConfirmDeleteAccount: () => void;
  onDeletePhoto: (photoId: string) => void;
  onMakePrimaryPhoto: (photoId: string) => void;
  onMovePhotoLeft: (photoId: string) => void;
  onMovePhotoRight: (photoId: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onSave: () => void;
  onSetBio: (value: string) => void;
  onSetCity: (value: string) => void;
  onSelectCitySuggestion: (suggestion: LocationSuggestion) => void;
  onSetIntensityLevel: (value: string) => void;
  onSetIntentDating: (value: boolean) => void;
  onSetIntentFriends: (value: boolean) => void;
  onSetIntentWorkout: (value: boolean) => void;
  onSetPrimaryGoal: (value: string) => void;
  onSetSelectedActivities: (value: string) => void;
  onSetSelectedSchedule: (value: string) => void;
  onSetWeeklyFrequencyBand: (value: string) => void;
  onToggleBuildInfo: () => void;
  onUploadPhoto: () => void;
  photoOperation: PhotoOperationState;
  primaryGoal: string;
  profile: User;
  selectedActivities: string[];
  selectedSchedule: string[];
  showBuildInfo: boolean;
  weeklyFrequencyBand: string;
}) {
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled);

  useEffect(() => {
    loadHapticsPreference().then(setHapticsOn).catch(() => {});
  }, []);

  const handleToggleHaptics = (enabled: boolean) => {
    setHapticsOn(enabled);
    void setHapticsEnabled(enabled);
  };

  const primaryPhoto = getPrimaryPhotoUri(profile);
  const isSaving = isSavingFitness || isSavingProfile;
  const buildRows = [
    { label: 'Provenance', value: buildInfo.provenanceSource === 'scripted-release' ? 'scripted release metadata' : 'runtime-derived metadata' },
    { label: 'App env', value: buildInfo.appEnv },
    { label: 'Version', value: buildInfo.version },
    { label: Platform.OS === 'android' ? 'Android code' : 'iOS build', value: Platform.OS === 'android' ? buildInfo.androidVersionCode : buildInfo.iosBuildNumber },
    ...(Platform.OS === 'android'
      ? [{ label: 'iOS build', value: buildInfo.iosBuildNumber }]
      : [{ label: 'Android code', value: buildInfo.androidVersionCode }]),
    { label: 'Branch', value: buildInfo.gitBranch },
    { label: 'Git SHA', value: buildInfo.gitSha },
    { label: 'API URL', value: buildInfo.apiBaseUrl || 'not set' },
    { label: 'Build timestamp (UTC)', value: buildInfo.buildDate },
    { label: 'Timestamp source', value: buildInfo.buildDateSource },
    { label: 'Release path', value: buildInfo.releaseMode },
    ...(buildInfo.releaseProfile ? [{ label: 'Release profile', value: buildInfo.releaseProfile }] : []),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#C4A882" />}
      >
        <View style={styles.hero}>
          <View style={styles.heroPhotoWrap}>
            {primaryPhoto ? (
              <Image source={{ uri: primaryPhoto }} style={styles.heroPhoto} contentFit="cover" accessibilityLabel="Your profile photo" accessibilityRole="image" />
            ) : (
              <LinearGradient colors={['#C4A882', '#B8A9C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroFallback} accessibilityRole="image" accessibilityLabel="Profile avatar placeholder">
                <Text style={styles.heroFallbackText}>{getAvatarInitial(profile.firstName)}</Text>
              </LinearGradient>
            )}
            <LinearGradient colors={['transparent', '#FDFBF8']} style={styles.heroOverlay}>
              <View style={styles.heroCopyCard}>
                <Text style={styles.heroName} accessibilityRole="header">
                  {profile.firstName}
                  {profile.age ? `, ${profile.age}` : ''}
                </Text>
                {primaryGoal ? (
                  <View style={styles.intentBadge}>
                    <Text style={styles.intentBadgeText}>{PRIMARY_GOAL_OPTIONS.find((o) => o.value === primaryGoal)?.label ?? primaryGoal}</Text>
                  </View>
                ) : null}
                <Text style={styles.heroLocation}>{profile.profile?.city || 'Location not set'}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        <CompletenessBar
          score={completenessScore}
          missing={completenessMissing}
          onPressMissing={() => {
            if (!editMode) onSave();
          }}
        />

        <View style={styles.editBar}>
          <Pressable
            onPress={() => {
              void triggerLightImpactHaptic();
              onSave();
            }}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.editBtnWrap,
              editMode ? styles.editBtnActive : null,
              { minHeight: 44, opacity: pressed && !isSaving ? 0.88 : isSaving ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={editMode ? 'Save profile' : 'Edit profile'}
            accessibilityHint={editMode ? 'Saves your profile changes' : 'Enters profile edit mode'}
            accessibilityState={{ disabled: isSaving }}
          >
            <Text style={[styles.editBtnText, editMode ? styles.editBtnTextActive : null]}>
              {isSaving ? 'Saving...' : editMode ? 'Save' : 'Edit Profile'}
            </Text>
          </Pressable>
          {editMode ? (
            <Pressable
              onPress={() => {
                void triggerLightImpactHaptic();
                onCancelEdit();
              }}
              style={({ pressed }) => [styles.cancelBtn, { minHeight: 44, opacity: pressed ? 0.88 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
              accessibilityHint="Discards your unsaved profile edits"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow} accessibilityRole="header">Profile basics</Text>
          <Card style={styles.fieldsCard}>
            {editMode ? (
              <LocationField
                kind="city"
                label="City"
                knownSuggestions={knownLocationSuggestions}
                value={city}
                onChangeText={onSetCity}
                onSelectSuggestion={onSelectCitySuggestion}
                placeholder="Honolulu"
                sheetTitle="Choose your city"
                sheetSubtitle="Use recent places, known BRDG spots, or curated city suggestions."
              />
            ) : (
              <EditableField label="City" value={city} onChangeText={onSetCity} placeholder="Honolulu" editMode={false} />
            )}
            <View style={styles.fieldDivider} />
            <EditableField
              label="Bio"
              value={bio}
              onChangeText={onSetBio}
              placeholder="Write a short bio"
              editMode={editMode}
              multiline
              inputProps={{
                autoCorrect: true,
                maxLength: 280,
                returnKeyType: 'done',
                scrollEnabled: false,
              }}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow} accessibilityRole="header">Intent</Text>
          <View style={styles.tagCloud}>
            <TagPill label="Dating" selected={intentDating} onPress={() => onSetIntentDating(!intentDating)} color="#D4A59A" interactive={editMode} />
            <TagPill label="Workout" selected={intentWorkout} onPress={() => onSetIntentWorkout(!intentWorkout)} color="#C4A882" interactive={editMode} />
            <TagPill label="Friends" selected={intentFriends} onPress={() => onSetIntentFriends(!intentFriends)} color="#8BAA7A" interactive={editMode} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow} accessibilityRole="header">Photos</Text>
          <PhotoManager
            canEdit={editMode}
            isBusy={editingPhotos}
            onDelete={onDeletePhoto}
            onMakePrimary={onMakePrimaryPhoto}
            onMoveLeft={onMovePhotoLeft}
            onMoveRight={onMovePhotoRight}
            onUpload={onUploadPhoto}
            operation={photoOperation}
            photos={profile.photos ?? []}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow} accessibilityRole="header">Movement Identity</Text>
          <View style={styles.tagCloud}>
            {ACTIVITY_OPTIONS.map(({ label, value, color }) => (
              <TagPill
                key={value}
                label={label}
                selected={selectedActivities.includes(value)}
                onPress={() => editMode && onSetSelectedActivities(value)}
                color={color}
                interactive={editMode}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow} accessibilityRole="header">Fitness Profile</Text>
          <Card style={styles.fieldsCard}>
            {editMode ? (
              <SheetSelectField
                label="Intensity"
                placeholder="Choose an intensity"
                options={INTENSITY_OPTIONS}
                value={intensityLevel}
                onSelect={onSetIntensityLevel}
                sheetTitle="Choose your training intensity"
              />
            ) : (
              <EditableField label="Intensity" value={intensityLevel} onChangeText={onSetIntensityLevel} placeholder="moderate" editMode={false} />
            )}
            <View style={styles.fieldDivider} />
            {editMode ? (
              <SheetSelectField
                label="Days / week"
                placeholder="Choose your weekly rhythm"
                options={WEEKLY_FREQUENCY_OPTIONS}
                value={weeklyFrequencyBand}
                onSelect={onSetWeeklyFrequencyBand}
                sheetTitle="How often do you move?"
              />
            ) : (
              <EditableField label="Days / week" value={weeklyFrequencyBand} onChangeText={onSetWeeklyFrequencyBand} placeholder="3-4" editMode={false} />
            )}
            <View style={styles.fieldDivider} />
            {editMode ? (
              <SheetSelectField
                label="Primary goal"
                placeholder="Choose your primary goal"
                options={PRIMARY_GOAL_OPTIONS}
                value={primaryGoal}
                onSelect={onSetPrimaryGoal}
                sheetTitle="Choose your primary goal"
              />
            ) : (
              <EditableField label="Primary goal" value={primaryGoal} onChangeText={onSetPrimaryGoal} placeholder="health" editMode={false} />
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow} accessibilityRole="header">Schedule</Text>
          <View style={styles.tagCloud}>
            {SCHEDULE_OPTIONS.map((tag) => (
              <TagPill
                key={tag}
                label={tag}
                selected={selectedSchedule.includes(tag)}
                onPress={() => editMode && onSetSelectedSchedule(tag)}
                color="#8BAA7A"
                interactive={editMode}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow} accessibilityRole="header">Settings</Text>
          <Card style={styles.settingsCard}>
            <SettingsRow icon="👤" label="Account" onPress={() => Alert.alert('Coming Soon', 'This feature is not yet available.')} accessibilityHint="Opens account settings" />
            <View style={styles.fieldDivider} />
            <SettingsRow icon="🔒" label="Privacy" onPress={() => Alert.alert('Coming Soon', 'This feature is not yet available.')} accessibilityHint="Opens privacy settings" />
            <View style={styles.fieldDivider} />
            <SettingsRow icon="🔔" label="Notifications" onPress={() => navigation.navigate('Notifications')} accessibilityHint="Opens notifications" />
            <View style={styles.fieldDivider} />
            <SettingsToggleRow testID="haptic-feedback-toggle" icon="📳" label="Haptic Feedback" value={hapticsOn} onValueChange={handleToggleHaptics} />
            <View style={styles.fieldDivider} />
            <SettingsRow testID="build-provenance-toggle" icon="🧾" label="Build provenance" accessory={showBuildInfo ? '⌄' : '›'} onPress={onToggleBuildInfo} accessibilityHint="Expands build details" accessibilityState={{ expanded: showBuildInfo }} />
            {showBuildInfo ? (
              <>
                <View style={styles.fieldDivider} />
                <Card testID="build-provenance-panel" style={styles.buildInfoCard}>
                  {buildRows.map((row, index) => (
                    <View key={row.label}>
                      <BuildInfoRow label={row.label} value={row.value} />
                      {index < buildRows.length - 1 ? <View style={styles.buildInfoDivider} /> : null}
                    </View>
                  ))}
                </Card>
              </>
            ) : null}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow} accessibilityRole="header">Account deletion</Text>
          <Card style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete your account</Text>
            <Text style={styles.dangerBody}>This permanently deletes your profile and all data.</Text>
            <Button label={deletingAccount ? 'Deleting...' : 'Delete account'} onPress={onConfirmDeleteAccount} disabled={deletingAccount} variant="danger" style={styles.deleteAccountBtn} />
          </Card>
        </View>

        <Pressable
          onPress={() => {
            void triggerLightImpactHaptic();
            onLogout();
          }}
          style={({ pressed }) => [
            styles.logoutBtn,
            { minHeight: 48, paddingHorizontal: 16, opacity: pressed ? 0.82 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          hitSlop={8}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
