import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { RefObject } from 'react';
import { AppBottomSheet, APP_BOTTOM_SHEET_SNAP_POINTS } from '../../../../design/sheets/AppBottomSheet';
import { Button } from '../../../../design/primitives';
import { useTheme } from '../../../../theme/useTheme';
import { radii, spacing, typography } from '../../../../theme/tokens';

export function EditIntentSheet({
  intentDating,
  intentFriends,
  intentWorkout,
  isSaving,
  onDismiss,
  onSave,
  onSetIntentDating,
  onSetIntentFriends,
  onSetIntentWorkout,
  refObject,
  visible,
}: {
  intentDating: boolean;
  intentFriends: boolean;
  intentWorkout: boolean;
  isSaving: boolean;
  onDismiss: () => void;
  onSave: () => Promise<boolean>;
  onSetIntentDating: (value: boolean) => void;
  onSetIntentFriends: (value: boolean) => void;
  onSetIntentWorkout: (value: boolean) => void;
  refObject: RefObject<BottomSheetModal | null>;
  visible: boolean;
}) {
  const handleSave = async () => {
    const ok = await onSave();
    if (ok) onDismiss();
  };

  return (
    <AppBottomSheet
      refObject={refObject}
      visible={visible}
      onDismiss={onDismiss}
      title="What are you open to?"
      subtitle="Select everything that applies. People will see this on your profile."
      snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.compact}
    >
      <View style={styles.options}>
        <IntentOption
          active={intentDating}
          description="Meet people you might connect with"
          label="Dating"
          onPress={() => onSetIntentDating(!intentDating)}
        />
        <IntentOption
          active={intentWorkout}
          description="Find someone to train with"
          label="Workout Partner"
          onPress={() => onSetIntentWorkout(!intentWorkout)}
        />
        <IntentOption
          active={intentFriends}
          description="Meet new friends who move"
          label="Friends"
          onPress={() => onSetIntentFriends(!intentFriends)}
        />
      </View>

      <Button
        label={isSaving ? 'Saving...' : 'Save'}
        onPress={() => { void handleSave(); }}
        disabled={isSaving}
        variant="primary"
      />
    </AppBottomSheet>
  );
}

function IntentOption({
  active,
  description,
  label,
  onPress,
}: {
  active: boolean;
  description: string;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={`${label}: ${description}`}
      style={[
        styles.intentCard,
        {
          backgroundColor: active ? theme.accentSoft : theme.surface,
          borderColor: active ? theme.accentPrimary : theme.stroke,
        },
      ]}
    >
      <Text
        style={[
          styles.intentLabel,
          { color: active ? theme.accentPrimary : theme.textPrimary },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.intentDescription, { color: theme.textSecondary }]}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: spacing.sm,
  },
  intentCard: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  intentLabel: {
    fontSize: typography.body,
    fontWeight: '800',
  },
  intentDescription: {
    fontSize: typography.caption,
    fontWeight: '500',
    lineHeight: 18,
  },
});
