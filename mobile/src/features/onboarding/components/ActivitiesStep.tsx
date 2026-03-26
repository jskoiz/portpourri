import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../../../design/primitives';
import AppIcon from '../../../components/ui/AppIcon';
import { styles } from '../onboarding.styles';
import { ACTIVITIES } from './constants';
import { OnboardingFullscreenStep, OnboardingStepIntro } from './OnboardingStepLayout';
import type { OnboardingStepProps } from './types';

export function ActivitiesStep({ data, goNext, insets, setValue, theme, toggleArray }: OnboardingStepProps) {
  return (
    <OnboardingFullscreenStep
      footer={<Button label="Continue" onPress={goNext} disabled={data.activities.length === 0} />}
      insetsBottom={insets.bottom}
    >
      <OnboardingStepIntro title="How do you like to move?" subtitle="Pick all that apply." theme={theme} />
      <View style={styles.activityGrid}>
        {ACTIVITIES.map((act) => {
          const selected = data.activities.includes(act.key);
          return (
            <Pressable
              key={act.key}
              onPress={() => setValue('activities', toggleArray(data.activities, act.key))}
              style={[
                styles.activityTile,
                {
                  backgroundColor: selected ? theme.primarySubtle : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                  borderWidth: selected ? 2 : 1.5,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={act.label}
              accessibilityHint={selected ? 'Selected' : 'Double tap to toggle'}
            >
              <View style={[styles.activityIconWrap, { backgroundColor: selected ? theme.primarySubtle : theme.surfaceElevated }]}>
                <AppIcon name={act.icon} size={16} color={selected ? theme.primary : theme.textSecondary} />
              </View>
              <Text style={[styles.activityLabel, { color: selected ? theme.primary : theme.textPrimary }]}>
                {act.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFullscreenStep>
  );
}
