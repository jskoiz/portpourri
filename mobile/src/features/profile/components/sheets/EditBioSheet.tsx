import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { RefObject } from 'react';
import { AppBottomSheet, APP_BOTTOM_SHEET_SNAP_POINTS } from '../../../../design/sheets/AppBottomSheet';
import { Button } from '../../../../design/primitives';
import { LocationField } from '../../../../components/form/LocationField';
import type { LocationSuggestion } from '../../../locations/locationSuggestions';
import { useTheme } from '../../../../theme/useTheme';
import { radii, spacing, typography } from '../../../../theme/tokens';

export function EditBioSheet({
  bio,
  city,
  isSaving,
  knownLocationSuggestions,
  onDismiss,
  onSave,
  onSelectCitySuggestion,
  onSetBio,
  onSetCity,
  refObject,
  visible,
}: {
  bio: string;
  city: string;
  isSaving: boolean;
  knownLocationSuggestions: LocationSuggestion[];
  onDismiss: () => void;
  onSave: () => Promise<boolean>;
  onSelectCitySuggestion: (suggestion: LocationSuggestion) => void;
  onSetBio: (value: string) => void;
  onSetCity: (value: string) => void;
  refObject: RefObject<BottomSheetModal | null>;
  visible: boolean;
}) {
  const theme = useTheme();

  const handleSave = async () => {
    const ok = await onSave();
    if (ok) onDismiss();
  };

  return (
    <AppBottomSheet
      refObject={refObject}
      visible={visible}
      onDismiss={onDismiss}
      title="Edit About"
      snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.tall}
    >
      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textMuted }]}>City</Text>
        <LocationField
          kind="city"
          label=""
          knownSuggestions={knownLocationSuggestions}
          value={city}
          onChangeText={onSetCity}
          onSelectSuggestion={onSelectCitySuggestion}
          placeholder="Honolulu"
          sheetTitle="Choose your city"
          sheetSubtitle="Use recent places or curated city suggestions."
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Bio</Text>
        <TextInput
          style={[
            styles.bioInput,
            {
              color: theme.textPrimary,
              backgroundColor: theme.fieldSurface,
              borderColor: theme.stroke,
            },
          ]}
          value={bio}
          onChangeText={onSetBio}
          placeholder="Write a bit about yourself (20+ characters)"
          placeholderTextColor={theme.textMuted}
          multiline
          autoCorrect
          maxLength={280}
          textAlignVertical="top"
          accessibilityLabel="Bio"
        />
        <Text style={[styles.charCount, { color: theme.textMuted }]}>
          {bio.length}/280
        </Text>
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

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bioInput: {
    fontSize: typography.body,
    fontWeight: '500',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 120,
  },
  charCount: {
    fontSize: typography.caption,
    fontWeight: '600',
    textAlign: 'right',
  },
});
