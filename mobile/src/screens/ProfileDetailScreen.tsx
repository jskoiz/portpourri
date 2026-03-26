import React from 'react';
import { Alert, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeApiError } from '../api/errors';
import type { RootStackScreenProps } from '../core/navigation/types';
import AppBackButton from '../components/ui/AppBackButton';
import AppBackdrop from '../components/ui/AppBackdrop';
import { Screen, StatePanel } from '../design/primitives';
import { useDiscoveryActions } from '../features/discovery/hooks/useDiscoveryActions';
import { useMatches } from '../features/matches/hooks/useMatches';
import { useSheetController } from '../design/sheets/useSheetController';
import { parseFavoriteActivities } from '../lib/profile-helpers';
import { getPrimaryPhotoUri } from '../lib/profilePhotos';
import { ReportSheet } from '../features/moderation/components/ReportSheet';
import { useBlock } from '../features/moderation/hooks/useBlock';
import { showBlockConfirmation } from '../features/moderation/components/BlockConfirmation';
import { isBlockedUserId } from '../lib/moderation/blockedUsers';
import { profileApi } from '../services/api';
import { queryKeys } from '../lib/query/queryKeys';
import {
  ProfileDetailActions,
  ProfileDetailHero,
  ProfileDetailInfo,
  type ProfileDetailRow,
} from '../features/profile/components/ProfileDetailSections';
import { profileDetailStyles as styles } from '../features/profile/components/profileDetail.styles';

export default function ProfileDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'ProfileDetail'>) {
  const insets = useSafeAreaInsets();
  const { user, userId } = route.params;
  const requestedUserId = userId ?? user?.id;
  const blockedRequestedUser = requestedUserId
    ? isBlockedUserId(requestedUserId)
    : false;
  const { matches } = useMatches();
  const { passUser, likeUser, isActing } = useDiscoveryActions();
  const submitting = isActing;
  const reportSheet = useSheetController();
  const { block, isLoading: isBlocking } = useBlock({
    onSuccess: () => navigation.goBack(),
  });
  const publicProfileQuery = useQuery({
    enabled: Boolean(requestedUserId) && !blockedRequestedUser,
    queryKey: queryKeys.profile.public(requestedUserId ?? 'unknown'),
    queryFn: async () => (await profileApi.getPublicProfile(requestedUserId!)).data,
    retry: false,
  });

  if (!requestedUserId) {
    return (
      <Screen>
        <AppBackButton onPress={() => navigation.goBack()} />
        <StatePanel
          title="Profile not found"
          description="This profile is no longer available."
        />
      </Screen>
    );
  }

  if (blockedRequestedUser) {
    return (
      <Screen>
        <AppBackButton onPress={() => navigation.goBack()} />
        <StatePanel
          title="Profile unavailable"
          description="This profile can no longer be viewed."
        />
      </Screen>
    );
  }

  if (publicProfileQuery.isLoading) {
    return (
      <Screen>
        <AppBackButton onPress={() => navigation.goBack()} />
        <StatePanel title="Loading profile" loading />
      </Screen>
    );
  }

  const resolvedUser = publicProfileQuery.data ?? null;
  if (publicProfileQuery.error || !resolvedUser) {
    return (
      <Screen>
        <AppBackButton onPress={() => navigation.goBack()} />
        <StatePanel
          title="Profile not found"
          description="This profile is no longer available."
        />
      </Screen>
    );
  }

  const primaryPhoto = getPrimaryPhotoUri(resolvedUser);
  const activityTags: string[] = parseFavoriteActivities(
    resolvedUser.fitnessProfile?.favoriteActivities,
  );

  const intentFlags = [
    resolvedUser.profile?.intentDating ? 'Dating' : null,
    resolvedUser.profile?.intentWorkout ? 'Training partner' : null,
    resolvedUser.profile?.intentFriends ? 'Friends' : null,
  ].filter(Boolean);

  const intentDisplay = intentFlags.length > 0 ? intentFlags.join(' + ') : null;
  const isBusy = submitting || isBlocking;
  const structuredRows: ProfileDetailRow[] = [
    {
      label: 'Pace',
      value: resolvedUser.fitnessProfile?.intensityLevel
        ? `${resolvedUser.fitnessProfile.intensityLevel}`
        : 'Not set',
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

  const handleBlock = () => {
    if (isBlocking) return;
    showBlockConfirmation(() => {
      void block({ blockedUserId: resolvedUser.id });
    });
  };

  const handleReport = () => {
    reportSheet.open();
  };

  const handleSuggestActivity = () => {
    const firstActivity = activityTags[0] || 'a workout';
    const suggestion = `Let's plan ${firstActivity} together.`;
    const existingMatch = matches.find((match) => match.user.id === resolvedUser.id);

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
      await passUser(resolvedUser.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not pass profile', normalizeApiError(error).message);
    }
  };

  const handleLike = async () => {
    try {
      await likeUser(resolvedUser.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not like profile', normalizeApiError(error).message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppBackdrop />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileDetailHero
          activityTags={activityTags}
          age={resolvedUser.age}
          city={resolvedUser.profile?.city}
          firstName={resolvedUser.firstName}
          intentDisplay={intentDisplay}
          onBack={() => navigation.goBack()}
          onBlock={handleBlock}
          onReport={handleReport}
          photoUri={primaryPhoto}
        />
        <ProfileDetailInfo
          activityTags={activityTags}
          bio={resolvedUser.profile?.bio}
          disabled={isBusy}
          onSuggestActivity={handleSuggestActivity}
          structuredRows={structuredRows}
          weeklyFrequencyBand={resolvedUser.fitnessProfile?.weeklyFrequencyBand}
        />
      </ScrollView>
      <ProfileDetailActions
        bottomInset={insets.bottom}
        onLike={handleLike}
        onPass={handlePass}
        submitting={isBusy}
      />

      <ReportSheet
        controller={reportSheet.sheetProps}
        onClose={reportSheet.close}
        reportedUserId={resolvedUser.id}
      />
    </SafeAreaView>
  );
}
