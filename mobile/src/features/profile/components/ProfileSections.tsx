import React from 'react';
import { Image, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ProfileCompletenessMissingItem, User } from '../../../api/types';
import { LocationField } from '../../../components/form/LocationField';
import { SheetSelectField } from '../../../components/form/SheetSelectField';
import { Button, Card, Chip } from '../../../design/primitives';
import { getAvatarInitial, getPrimaryPhotoUri } from '../../../lib/profilePhotos';
import type { LocationSuggestion } from '../../locations/locationSuggestions';
import type { PhotoOperationState } from '../hooks/usePhotoManager';
import { profileStyles as styles } from './profile.styles';
import {
  ACTIVITY_OPTIONS,
  INTENSITY_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SCHEDULE_OPTIONS,
  WEEKLY_FREQUENCY_OPTIONS,
} from './profile.helpers';
import { CompletenessBar } from './CompletenessBar';
import { PhotoManager } from './ProfilePhotoSection';
import { ProfileSettingsSection as ProfileSettingsCard } from './ProfileSettingsSection';

export { PhotoManager } from './ProfilePhotoSection';

function Section({ children, eyebrow }: { children: React.ReactNode; eyebrow: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      {children}
    </View>
  );
}

export function TagPill({
  color = '#C4A882',
  interactive = true,
  label,
  onPress,
  selected,
}: {
  color?: string;
  interactive?: boolean;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Chip
      onPress={onPress}
      label={label}
      active={selected}
      accentColor={color}
      interactive={interactive}
      style={styles.tagPill}
      textStyle={styles.tagPillText}
    />
  );
}

export function EditableField({
  editMode,
  inputProps,
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  editMode: boolean;
  inputProps?: TextInputProps;
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {editMode ? (
        <TextInput
          style={[styles.fieldInput, multiline ? styles.fieldInputMultiline : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B0A89E"
          autoCapitalize={multiline ? 'sentences' : 'none'}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...inputProps}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: value ? '#2C2420' : '#B0A89E' }]}>
          {value || placeholder}
        </Text>
      )}
    </View>
  );
}

export function ProfileHeroSection({
  primaryGoal,
  profile,
}: {
  primaryGoal: string;
  profile: User;
}) {
  const primaryPhoto = getPrimaryPhotoUri(profile);

  return (
    <View style={styles.hero}>
      <View style={styles.heroPhotoWrap}>
        {primaryPhoto ? (
          <Image source={{ uri: primaryPhoto }} style={styles.heroPhoto} accessibilityLabel="Your profile photo" />
        ) : (
          <LinearGradient colors={['#C4A882', '#B8A9C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroFallback}>
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
                <Text style={styles.intentBadgeText}>
                  {PRIMARY_GOAL_OPTIONS.find((option) => option.value === primaryGoal)?.label ?? primaryGoal}
                </Text>
              </View>
            ) : null}
            <Text style={styles.heroLocation}>{profile.profile?.city || 'Location not set'}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

export function ProfileHeaderSection({
  completenessMissing,
  completenessScore,
  editMode,
  errorMessage,
  isSaving,
  onCancelEdit,
  onPrimaryAction,
}: {
  completenessMissing: ProfileCompletenessMissingItem[];
  completenessScore: number;
  editMode: boolean;
  errorMessage: string | null;
  isSaving: boolean;
  onCancelEdit: () => void;
  onPrimaryAction: () => void;
}) {
  return (
    <>
      <CompletenessBar
        score={completenessScore}
        missing={completenessMissing}
        onPressMissing={() => {
          if (!editMode) onPrimaryAction();
        }}
      />

      <View style={styles.editBar}>
        <Pressable
          onPress={onPrimaryAction}
          disabled={isSaving}
          style={[styles.editBtnWrap, editMode ? styles.editBtnActive : null]}
          accessibilityRole="button"
          accessibilityLabel={editMode ? 'Save profile' : 'Edit profile'}
          accessibilityState={{ disabled: isSaving }}
        >
          <Text style={[styles.editBtnText, editMode ? styles.editBtnTextActive : null]}>
            {isSaving ? 'Saving...' : editMode ? 'Save' : 'Edit Profile'}
          </Text>
        </Pressable>
        {editMode ? (
          <Pressable onPress={onCancelEdit} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        ) : null}
      </View>

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
    </>
  );
}

export function ProfileBasicsSection({
  bio,
  city,
  editMode,
  knownLocationSuggestions,
  onSelectCitySuggestion,
  onSetBio,
  onSetCity,
}: {
  bio: string;
  city: string;
  editMode: boolean;
  knownLocationSuggestions: LocationSuggestion[];
  onSelectCitySuggestion: (suggestion: LocationSuggestion) => void;
  onSetBio: (value: string) => void;
  onSetCity: (value: string) => void;
}) {
  return (
    <Section eyebrow="Profile basics">
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
    </Section>
  );
}

export function ProfileIntentSection({
  editMode,
  intentDating,
  intentFriends,
  intentWorkout,
  onSetIntentDating,
  onSetIntentFriends,
  onSetIntentWorkout,
}: {
  editMode: boolean;
  intentDating: boolean;
  intentFriends: boolean;
  intentWorkout: boolean;
  onSetIntentDating: (value: boolean) => void;
  onSetIntentFriends: (value: boolean) => void;
  onSetIntentWorkout: (value: boolean) => void;
}) {
  return (
    <Section eyebrow="Intent">
      <View style={styles.tagCloud}>
        <TagPill label="Dating" selected={intentDating} onPress={() => onSetIntentDating(!intentDating)} color="#D4A59A" interactive={editMode} />
        <TagPill label="Workout" selected={intentWorkout} onPress={() => onSetIntentWorkout(!intentWorkout)} color="#C4A882" interactive={editMode} />
        <TagPill label="Friends" selected={intentFriends} onPress={() => onSetIntentFriends(!intentFriends)} color="#8BAA7A" interactive={editMode} />
      </View>
    </Section>
  );
}

export function ProfilePhotosSection(props: React.ComponentProps<typeof PhotoManager>) {
  return (
    <Section eyebrow="Photos">
      <PhotoManager {...props} />
    </Section>
  );
}

export function ProfileMovementSection({
  editMode,
  onSetSelectedActivities,
  selectedActivities,
}: {
  editMode: boolean;
  onSetSelectedActivities: (value: string) => void;
  selectedActivities: string[];
}) {
  return (
    <Section eyebrow="Movement Identity">
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
    </Section>
  );
}

export function ProfileFitnessSection({
  editMode,
  intensityLevel,
  onSetIntensityLevel,
  onSetPrimaryGoal,
  onSetWeeklyFrequencyBand,
  primaryGoal,
  weeklyFrequencyBand,
}: {
  editMode: boolean;
  intensityLevel: string;
  onSetIntensityLevel: (value: string) => void;
  onSetPrimaryGoal: (value: string) => void;
  onSetWeeklyFrequencyBand: (value: string) => void;
  primaryGoal: string;
  weeklyFrequencyBand: string;
}) {
  return (
    <Section eyebrow="Fitness Profile">
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
    </Section>
  );
}

export function ProfileScheduleSection({
  editMode,
  onSetSelectedSchedule,
  selectedSchedule,
}: {
  editMode: boolean;
  onSetSelectedSchedule: (value: string) => void;
  selectedSchedule: string[];
}) {
  return (
    <Section eyebrow="Schedule">
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
    </Section>
  );
}

export function ProfileSettingsSection({
  buildRows,
  hapticsOn,
  onOpenNotifications,
  onToggleBuildInfo,
  onToggleHaptics,
  showBuildInfo,
}: {
  buildRows: Array<{ label: string; value: string }>;
  hapticsOn: boolean;
  onOpenNotifications: () => void;
  onToggleBuildInfo: () => void;
  onToggleHaptics: (value: boolean) => void;
  showBuildInfo: boolean;
}) {
  return (
    <Section eyebrow="Settings">
      <ProfileSettingsCard
        buildRows={buildRows}
        hapticsOn={hapticsOn}
        onOpenNotifications={onOpenNotifications}
        onToggleBuildInfo={onToggleBuildInfo}
        onToggleHaptics={onToggleHaptics}
        showBuildInfo={showBuildInfo}
      />
    </Section>
  );
}

export function ProfileDangerSection({
  deletingAccount,
  onConfirmDeleteAccount,
  onLogout,
}: {
  deletingAccount: boolean;
  onConfirmDeleteAccount: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <Section eyebrow="Account deletion">
        <Card style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Delete your account</Text>
          <Text style={styles.dangerBody}>This permanently deletes your profile and all data.</Text>
          <Button label={deletingAccount ? 'Deleting...' : 'Delete account'} onPress={onConfirmDeleteAccount} disabled={deletingAccount} variant="danger" style={styles.deleteAccountBtn} />
        </Card>
      </Section>

      <TouchableOpacity
        onPress={onLogout}
        style={[styles.logoutBtn, { minHeight: 48 }]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </>
  );
}
