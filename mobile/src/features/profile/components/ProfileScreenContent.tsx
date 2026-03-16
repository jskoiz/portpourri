import React from 'react';
import { Image, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildInfo } from '../../../config/buildInfo';
import type { User } from '../../../api/types';
import { Button, Card } from '../../../design/primitives';
import { profileStyles as styles } from './profile.styles';
import { ACTIVITY_OPTIONS, ENVIRONMENT_OPTIONS, SCHEDULE_OPTIONS } from './profile.helpers';
import { EditableField, PhotoManager, TagPill } from './ProfileSections';
import type { PhotoOperationState } from '../hooks/useProfileEditor';
import { getAvatarInitial, getPrimaryPhotoUri } from '../../../lib/profilePhotos';

function SettingsRow({
  accessory = '›',
  icon,
  label,
  onPress,
  testID,
}: {
  accessory?: string;
  icon: string;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <TouchableOpacity testID={testID} style={styles.settingsRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.settingsArrow}>{accessory}</Text>
    </TouchableOpacity>
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
  const primaryPhoto = getPrimaryPhotoUri(profile);
  const buildRows = [
    { label: 'App env', value: buildInfo.appEnv },
    { label: 'Version', value: `${buildInfo.version} (${buildInfo.iosBuildNumber})` },
    { label: 'Branch', value: buildInfo.gitBranch },
    { label: 'Git SHA', value: buildInfo.gitSha },
    { label: 'API URL', value: buildInfo.apiBaseUrl || 'not set' },
    { label: 'Built at', value: buildInfo.buildDate },
    { label: 'Release path', value: buildInfo.releaseMode },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroBg} pointerEvents="none" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#7C6AF7" />}
      >
        <View style={styles.hero}>
          <View style={styles.avatarGlowWrap}>
            <LinearGradient colors={['#7C6AF7', '#34D399']} style={styles.avatarGlowRing}>
              <View style={styles.avatarInnerWrap}>
                {primaryPhoto ? (
                  <Image source={{ uri: primaryPhoto }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{getAvatarInitial(profile.firstName)}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>
          <Text style={styles.heroName}>
            {profile.firstName}
            {profile.age ? `, ${profile.age}` : ''}
          </Text>
          <View style={styles.intentBadge}>
            <Text style={styles.intentBadgeText}>🏃 Active Mover</Text>
          </View>
          <Text style={styles.heroLocation}>📍 {profile.profile?.city || 'Location not set'}</Text>
          <View style={styles.ambientStats}>
            <View style={styles.ambientStat}>
              <Text style={[styles.ambientStatNum, { color: '#7C6AF7' }]}>12</Text>
              <Text style={styles.ambientStatLabel}>matches</Text>
            </View>
            <View style={styles.ambientStatDot} />
            <View style={styles.ambientStat}>
              <Text style={[styles.ambientStatNum, { color: '#34D399' }]}>8</Text>
              <Text style={styles.ambientStatLabel}>activities</Text>
            </View>
            <View style={styles.ambientStatDot} />
            <View style={styles.ambientStat}>
              <Text style={[styles.ambientStatNum, { color: '#F59E0B' }]}>5</Text>
              <Text style={styles.ambientStatLabel}>connections</Text>
            </View>
          </View>
        </View>

        <View style={styles.editBar}>
          <Pressable onPress={onSave} disabled={isSavingFitness} style={styles.editBtnWrap}>
            <LinearGradient
              colors={editMode ? ['#7C6AF7', '#7C6AF7AA'] : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
              style={styles.editBtn}
            >
              <Text style={[styles.editBtnText, { color: editMode ? '#FFFFFF' : 'rgba(240,246,252,0.6)' }]}>
                {isSavingFitness || isSavingProfile ? 'Saving...' : editMode ? '✓ Save Changes' : '✏️ Edit Profile'}
              </Text>
            </LinearGradient>
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

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Profile basics</Text>
          <Card style={styles.fieldsCard}>
            <EditableField label="City" value={city} onChangeText={onSetCity} placeholder="Honolulu" editMode={editMode} />
            <View style={styles.fieldDivider} />
            <EditableField label="Bio" value={bio} onChangeText={onSetBio} placeholder="Tell people what kind of movement and company you want." editMode={editMode} multiline />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Intent</Text>
          <View style={styles.tagCloud}>
            <TagPill label="Dating" selected={intentDating} onPress={() => onSetIntentDating(!intentDating)} color="#F87171" interactive={editMode} />
            <TagPill label="Workout" selected={intentWorkout} onPress={() => onSetIntentWorkout(!intentWorkout)} color="#7C6AF7" interactive={editMode} />
            <TagPill label="Friends" selected={intentFriends} onPress={() => onSetIntentFriends(!intentFriends)} color="#34D399" interactive={editMode} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Photos</Text>
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
          <Text style={styles.sectionEyebrow}>Movement Identity</Text>
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
          <Text style={styles.sectionEyebrow}>Fitness Profile</Text>
          <Card style={styles.fieldsCard}>
            <EditableField label="Intensity" value={intensityLevel} onChangeText={onSetIntensityLevel} placeholder="moderate" editMode={editMode} />
            <View style={styles.fieldDivider} />
            <EditableField label="Days / week" value={weeklyFrequencyBand} onChangeText={onSetWeeklyFrequencyBand} placeholder="3-4" editMode={editMode} />
            <View style={styles.fieldDivider} />
            <EditableField label="Primary goal" value={primaryGoal} onChangeText={onSetPrimaryGoal} placeholder="health" editMode={editMode} />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Schedule</Text>
          <View style={styles.tagCloud}>
            {SCHEDULE_OPTIONS.map((tag) => (
              <TagPill
                key={tag}
                label={tag}
                selected={selectedSchedule.includes(tag)}
                onPress={() => editMode && onSetSelectedSchedule(tag)}
                color="#34D399"
                interactive={editMode}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Environment</Text>
          <View style={styles.tagCloud}>
            {ENVIRONMENT_OPTIONS.map((tag) => (
              <TagPill key={tag} label={tag} selected={['Outdoors', 'Gym'].includes(tag)} onPress={() => undefined} color="#F59E0B" interactive={false} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Settings</Text>
          <Card style={styles.settingsCard}>
            <SettingsRow icon="👤" label="Account" onPress={() => undefined} />
            <View style={styles.fieldDivider} />
            <SettingsRow icon="🔒" label="Privacy" onPress={() => undefined} />
            <View style={styles.fieldDivider} />
            <SettingsRow icon="🔔" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
            <View style={styles.fieldDivider} />
            <SettingsRow testID="build-provenance-toggle" icon="🧾" label="Build provenance" accessory={showBuildInfo ? '⌄' : '›'} onPress={onToggleBuildInfo} />
            {showBuildInfo ? (
              <>
                <View style={styles.fieldDivider} />
                <Card testID="build-provenance-panel" style={styles.buildInfoCard as any}>
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
          <Text style={styles.sectionEyebrow}>Account deletion</Text>
          <Card style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete your account</Text>
            <Text style={styles.dangerBody}>Remove your BRDG profile and associated data directly from the app.</Text>
            <Button label={deletingAccount ? 'Deleting...' : 'Delete account'} onPress={onConfirmDeleteAccount} disabled={deletingAccount} variant="danger" style={styles.deleteAccountBtn} />
          </Card>
        </View>

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
