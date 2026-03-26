import React from 'react';
import { Animated, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackButton from '../../../components/ui/AppBackButton';
import AppBackdrop from '../../../components/ui/AppBackdrop';
import { useTheme } from '../../../theme/useTheme';
import { styles } from '../onboarding.styles';

type OnboardingFlowShellProps = {
  chapter: string;
  children: React.ReactNode;
  contentOpacity: Animated.Value;
  isSubmitting: boolean;
  onBack: () => void;
  progress: number;
  showBackButton: boolean;
};

export function OnboardingFlowShell({
  chapter,
  children,
  contentOpacity,
  isSubmitting,
  onBack,
  progress,
  showBackButton,
}: OnboardingFlowShellProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <AppBackdrop />
      <View
        style={[styles.progressTrack, { backgroundColor: theme.border }]}
        accessibilityRole="progressbar"
        accessibilityLabel="Onboarding progress"
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
          <AppBackButton onPress={onBack} disabled={isSubmitting} style={{ marginBottom: 0 }} />
        </View>
      ) : null}

      <View style={styles.shellHeader}>
        <Text style={[styles.chapterLabel, { color: theme.accent }]} accessibilityRole="header">{chapter}</Text>
      </View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}
