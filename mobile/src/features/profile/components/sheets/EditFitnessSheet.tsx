import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { RefObject } from 'react';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
} from '../../../../design/sheets/AppBottomSheet';
import { Button, Chip } from '../../../../design/primitives';
import { SheetSelectField } from '../../../../components/form/SheetSelectField';
import { useTheme } from '../../../../theme/useTheme';
import { spacing, typography } from '../../../../theme/tokens';
import {
  ACTIVITY_OPTIONS,
  INTENSITY_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SCHEDULE_OPTIONS,
  WEEKLY_FREQUENCY_OPTIONS,
} from '../profile.helpers';

export function EditFitnessSheet({
  intensityLevel,
  isSaving,
  onDismiss,
  onSave,
  onSetIntensityLevel,
  onSetPrimaryGoal,
  onSetSelectedActivities,
  onSetSelectedSchedule,
  onSetWeeklyFrequencyBand,
  primaryGoal,
  refObject,
  selectedActivities,
  selectedSchedule,
  visible,
  weeklyFrequencyBand,
}: {
  intensityLevel: string;
  isSaving: boolean;
  onDismiss: () => void;
  onSave: () => Promise<boolean>;
  onSetIntensityLevel: (value: string) => void;
  onSetPrimaryGoal: (value: string) => void;
  onSetSelectedActivities: (value: string) => void;
  onSetSelectedSchedule: (value: string) => void;
  onSetWeeklyFrequencyBand: (value: string) => void;
  primaryGoal: string;
  refObject: RefObject<BottomSheetModal | null>;
  selectedActivities: string[];
  selectedSchedule: string[];
  visible: boolean;
  weeklyFrequencyBand: string;
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
      title="Movement Profile"
      snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.tall}
    >
      {/* Activities */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Activities</Text>
        <View style={styles.chipRow}>
          {ACTIVITY_OPTIONS.map(({ label, value }) => (
            <Chip
              key={value}
              onPress={() => onSetSelectedActivities(value)}
              label={label}
              active={selectedActivities.includes(value)}
              accentColor={theme.accentPrimary}
              interactive
            />
          ))}
        </View>
      </View>

      {/* Fitness details */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Fitness Details</Text>
        <SheetSelectField
          label="Intensity"
          placeholder="Choose intensity"
          options={INTENSITY_OPTIONS}
          value={intensityLevel}
          onSelect={onSetIntensityLevel}
          sheetTitle="Training intensity"
        />
        <SheetSelectField
          label="Days / week"
          placeholder="Choose frequency"
          options={WEEKLY_FREQUENCY_OPTIONS}
          value={weeklyFrequencyBand}
          onSelect={onSetWeeklyFrequencyBand}
          sheetTitle="Weekly frequency"
        />
        <SheetSelectField
          label="Primary goal"
          placeholder="Choose goal"
          options={PRIMARY_GOAL_OPTIONS}
          value={primaryGoal}
          onSelect={onSetPrimaryGoal}
          sheetTitle="Primary goal"
        />
      </View>

      {/* Schedule */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Schedule</Text>
        <View style={styles.chipRow}>
          {SCHEDULE_OPTIONS.map((tag) => (
            <Chip
              key={tag}
              onPress={() => onSetSelectedSchedule(tag)}
              label={tag}
              active={selectedSchedule.includes(tag)}
              accentColor={theme.success}
              interactive
            />
          ))}
        </View>
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
  section: {
    gap: spacing.md,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
