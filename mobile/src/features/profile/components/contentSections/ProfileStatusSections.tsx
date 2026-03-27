import React from 'react';
import { Text, View } from 'react-native';
import type { ProfileCompletenessMissingItem } from '../../../../api/types';
import { CompletenessBar } from '../CompletenessBar';
import { profileStyles as styles } from '../profile.styles';

export function ProfileCompletenessSection({
  completenessEarned,
  completenessMissing,
  completenessScore,
  completenessTotal,
  editMode,
  onSave,
}: {
  completenessEarned: number;
  completenessScore: number;
  completenessMissing: ProfileCompletenessMissingItem[];
  completenessTotal: number;
  editMode: boolean;
  onSave: () => void;
}) {
  return (
    <CompletenessBar
      earned={completenessEarned}
      score={completenessScore}
      missing={completenessMissing}
      total={completenessTotal}
      onPressMissing={() => {
        if (!editMode) onSave();
      }}
    />
  );
}

export function ProfileErrorBanner({
  errorMessage,
}: {
  errorMessage: string | null;
}) {
  return errorMessage ? (
    <View style={styles.errorBanner}>
      <Text style={styles.errorText}>{errorMessage}</Text>
    </View>
  ) : null;
}
