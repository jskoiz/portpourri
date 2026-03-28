import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, screenLayout } from '../../../../design/primitives';
import { useTheme } from '../../../../theme/useTheme';
import { spacing, typography } from '../../../../theme/tokens';
import { CreateActivityPicker } from '../CreateActivityPicker';

type ActivityStepProps = {
  onNext: () => void;
  onSelectActivity: (value: string) => void;
  selectedActivity: string;
};

export function ActivityStep({ onNext, onSelectActivity, selectedActivity }: ActivityStepProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            What are you doing?
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Pick the activity — everything else follows from here.
          </Text>
        </View>
        <CreateActivityPicker
          selectedActivity={selectedActivity}
          onSelectActivity={onSelectActivity}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Next"
          onPress={onNext}
          disabled={!selectedActivity}
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
  footer: {
    paddingHorizontal: screenLayout.gutter,
    paddingBottom: spacing.xl,
  },
});
