import React from 'react';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalizeApiError } from '../api/errors';
import type { RootStackScreenProps } from '../core/navigation/types';
import AppBackButton from '../components/ui/AppBackButton';
import { Screen, ScreenScaffold, StatePanel } from '../design/primitives';
import { useDiscoveryActions } from '../features/discovery/hooks/useDiscoveryActions';
import { useMatches } from '../features/matches/hooks/useMatches';
import { useSheetController } from '../design/sheets/useSheetController';
import { getIntentLabels, parseFavoriteActivities } from '../lib/profile-helpers';
import { getPrimaryPhotoUri } from '../lib/profilePhotos';
import { ReportSheet } from '../features/moderation/components/ReportSheet';
import { useBlock } from '../features/moderation/hooks/useBlock';
import { showBlockConfirmation } from '../features/moderation/components/BlockConfirmation';
import {
  ProfileDetailActions,
  ProfileDetailHero,
  ProfileDetailInfo,
  type ProfileDetailRow,
} from '../features/profile/components/ProfileDetailSections';
import { profileDetailStyles as styles } from '../features/profile/components/profileDetail.styles';
import { useTheme } from '../theme/useTheme';

export default function ProfileDetailScreen({
  navigation,
  route,
}: RootStackScreenProps<'ProfileDetail'>) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { user } = route.params;
  const { matches } = useMatches();
  const { passUser, likeUser, isActing } = useDiscoveryActions();
  const submitting = isActing;
  const reportSheet = useSheetController();
  const { block, isLoading: isBlocking } = useBlock({
    onSuccess: () => navigation.goBack(),
  });

  if (!user) {
    return (
      <Screen backgroundColor={theme.background}>
        <AppBackButton onPress={() => navigation.goBack()} />
        <StatePanel
          title="Profile not found"
          description="This profile is no longer available."
        />
      </Screen>
    );
  }

  const primaryPhoto = getPrimaryPhotoUri(user);
  const activityTags: string[] = parseFavoriteActivities(
    user.fitnessProfile?.favoriteActivities,
  );

  const intentLabels = getIntentLabels(user);
  const intentDisplay = intentLabels.length > 0 ? intentLabels.join(' · ') : null;
  const isBusy = submitting || isBlocking;
  const structuredRows: ProfileDetailRow[] = [
    {
      label: 'Pace',
      value: user.fitnessProfile?.intensityLevel
        ? `${user.fitnessProfile.intensityLevel}`
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
    showBlockConfirmation(() => {
      void block({ targetUserId: user.id });
    });
  };

  const handleReport = () => {
    reportSheet.open();
  };

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
    <ScreenScaffold style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileDetailHero
          activityTags={activityTags}
          age={user.age}
          city={user.profile?.city}
          firstName={user.firstName}
          intentDisplay={intentDisplay}
          onBack={() => navigation.goBack()}
          onBlock={handleBlock}
          onReport={handleReport}
          photoUri={primaryPhoto}
        />
        <ProfileDetailInfo
          activityTags={activityTags}
          bio={user.profile?.bio}
          disabled={isBusy}
          onSuggestActivity={handleSuggestActivity}
          structuredRows={structuredRows}
          weeklyFrequencyBand={user.fitnessProfile?.weeklyFrequencyBand}
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
        reportedUserId={user.id}
      />
    </ScreenScaffold>
  );
}
