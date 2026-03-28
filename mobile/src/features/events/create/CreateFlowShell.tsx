import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackButton from '../../../components/ui/AppBackButton';
import AppBackdrop from '../../../components/ui/AppBackdrop';
import { useTheme } from '../../../theme/useTheme';
import { spacing } from '../../../theme/tokens';

type CreateFlowShellProps = {
  chapter: string;
  children: React.ReactNode;
  onBack: () => void;
  progress: number;
  showBackButton: boolean;
};

export function CreateFlowShell({
  chapter,
  children,
  onBack,
  progress,
  showBackButton,
}: CreateFlowShellProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <AppBackdrop />
      <View
        style={[styles.progressTrack, { backgroundColor: theme.border }]}
        accessibilityRole="progressbar"
        accessibilityLabel="Create event progress"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.min(100, Math.max(0, Math.round(progress * 100))),
          text: `${Math.round(progress * 100)}% complete`,
        }}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: theme.primary,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>

      {showBackButton ? (
        <View style={styles.backButtonRow}>
          <AppBackButton onPress={onBack} style={{ marginBottom: 0 }} />
        </View>
      ) : null}

      <View style={styles.shellHeader}>
        <Text style={[styles.chapterLabel, { color: theme.accent }]}>{chapter}</Text>
      </View>

      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressTrack: {
    height: 4,
    width: '100%',
    opacity: 0.7,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  backButtonRow: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  shellHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  chapterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
});
