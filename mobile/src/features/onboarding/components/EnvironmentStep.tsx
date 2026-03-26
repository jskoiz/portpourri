import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../../../design/primitives';
import AppIcon from '../../../components/ui/AppIcon';
import { styles } from '../onboarding.styles';
import { ENVIRONMENTS } from './constants';
import { OnboardingFullscreenStep, OnboardingStepIntro } from './OnboardingStepLayout';
import type { OnboardingStepProps } from './types';

export function EnvironmentStep({ data, goNext, insets, setValue, theme, toggleArray }: OnboardingStepProps) {
  return (
    <OnboardingFullscreenStep
      footer={<Button label="Continue" onPress={goNext} disabled={data.environment.length === 0} />}
      insetsBottom={insets.bottom}
    >
      <OnboardingStepIntro title="Where do you like to train?" subtitle="Pick all that apply." theme={theme} />
      <View style={styles.activityGrid}>
        {ENVIRONMENTS.map((env) => {
          const selected = data.environment.includes(env.key);
          return (
            <Pressable
              key={env.key}
              onPress={() => setValue('environment', toggleArray(data.environment, env.key))}
              style={[
                styles.activityTile,
                {
                  backgroundColor: selected ? theme.accentSubtle : theme.surface,
                  borderColor: selected ? theme.accent : theme.border,
                  borderWidth: selected ? 2 : 1.5,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={env.label}
              accessibilityHint={selected ? 'Selected' : 'Double tap to toggle'}
            >
              <View style={[styles.activityIconWrap, { backgroundColor: selected ? theme.accentSubtle : theme.surfaceElevated }]}>
                <AppIcon name={env.icon} size={16} color={selected ? theme.accent : theme.textSecondary} />
              </View>
              <Text style={[styles.activityLabel, { color: selected ? theme.accent : theme.textPrimary }]}>
                {env.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFullscreenStep>
  );
}
