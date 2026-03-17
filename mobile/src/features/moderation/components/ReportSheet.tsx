import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AppBottomSheet,
  APP_BOTTOM_SHEET_SNAP_POINTS,
  type AppBottomSheetProps,
} from '../../../design/sheets/AppBottomSheet';
import { Button } from '../../../design/primitives';
import { useTheme } from '../../../theme/useTheme';
import { radii, spacing, typography } from '../../../theme/tokens';
import { useReport } from '../hooks/useReport';
import type { ReportCategory } from '../../../api/types';

const CATEGORIES: { key: ReportCategory; label: string }[] = [
  { key: 'HARASSMENT', label: 'Harassment or bullying' },
  { key: 'SPAM', label: 'Spam or scam' },
  { key: 'FAKE_PROFILE', label: 'Fake profile' },
  { key: 'INAPPROPRIATE', label: 'Inappropriate content' },
  { key: 'OTHER', label: 'Other' },
];

export function ReportSheet({
  controller,
  onClose,
  reportedUserId,
  matchId,
}: {
  controller: Pick<
    AppBottomSheetProps,
    'onChangeIndex' | 'onDismiss' | 'onRequestClose' | 'refObject' | 'visible'
  >;
  onClose: () => void;
  reportedUserId: string;
  matchId?: string;
}) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const { report, isLoading } = useReport({
    onSuccess: () => {
      setSelectedCategory(null);
      setDescription('');
      onClose();
    },
  });

  const handleSubmit = async () => {
    if (!selectedCategory) return;
    await report({
      reportedUserId,
      matchId,
      category: selectedCategory,
      description: description.trim() || undefined,
    });
  };

  return (
    <AppBottomSheet
      {...controller}
      title="Report user"
      subtitle="Select a reason for this report."
      snapPoints={APP_BOTTOM_SHEET_SNAP_POINTS.form}
    >
      <View style={styles.categories}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setSelectedCategory(cat.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={cat.label}
              style={[
                styles.categoryRow,
                {
                  borderColor: isSelected ? theme.primary : theme.border,
                  backgroundColor: isSelected ? theme.primarySubtle : theme.surface,
                },
              ]}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isSelected ? theme.primary : theme.textMuted,
                  },
                ]}
              >
                {isSelected && (
                  <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                )}
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  { color: isSelected ? theme.textPrimary : theme.textSecondary },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={[
          styles.descriptionInput,
          {
            color: theme.textPrimary,
            borderColor: theme.border,
            backgroundColor: theme.surfaceElevated,
          },
        ]}
        placeholder="Additional details (optional)"
        placeholderTextColor={theme.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        maxLength={500}
        textAlignVertical="top"
        accessibilityLabel="Additional details"
      />

      <Button
        label={isLoading ? 'Submitting…' : 'Submit report'}
        variant="danger"
        onPress={() => { void handleSubmit(); }}
        disabled={!selectedCategory || isLoading}
        loading={isLoading}
      />
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  categories: {
    gap: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryLabel: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontSize: typography.body,
    minHeight: 80,
  },
});
