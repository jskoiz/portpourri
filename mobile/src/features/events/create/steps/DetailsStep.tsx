import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Button, screenLayout } from '../../../../design/primitives';
import { ControlledInputField } from '../../../../components/form/ControlledInputField';
import { StepperField } from '../../../../components/form/StepperField';
import { useTheme } from '../../../../theme/useTheme';
import { spacing, typography } from '../../../../theme/tokens';
import type { CreateEventFormValues } from '../../schema';

type DetailsStepProps = {
  control: Control<CreateEventFormValues>;
  isSubmitting: boolean;
  onChangeSpots: (value: number) => void;
  onPost: () => void;
  spots: number;
  submitError: string | null;
};

export function DetailsStep({
  control,
  isSubmitting,
  onChangeSpots,
  onPost,
  spots,
  submitError,
}: DetailsStepProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Final details
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Add a title, note, and how many can join.
          </Text>
        </View>

        <View style={styles.section}>
          <ControlledInputField
            control={control}
            name="title"
            label="Title"
            placeholder="e.g. Morning yoga at the park"
          />
        </View>

        <View style={styles.section}>
          <ControlledInputField
            control={control}
            name="note"
            label="Note (optional)"
            placeholder="Any details people should know?"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <StepperField
            label="Open spots"
            min={1}
            max={10}
            onChange={onChangeSpots}
            value={spots}
            helperText="How many people can join (besides you)."
          />
        </View>

        {submitError ? (
          <View style={styles.errorWrap}>
            <Text style={[styles.errorText, { color: theme.danger }]}>{submitError}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Next"
          onPress={onPost}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: screenLayout.gutter,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  errorWrap: {
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: screenLayout.gutter,
    paddingBottom: spacing.xl,
  },
});
