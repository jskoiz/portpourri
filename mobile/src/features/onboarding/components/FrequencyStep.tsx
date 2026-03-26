import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../../../design/primitives';
import { styles } from '../onboarding.styles';
import { FREQUENCY_OPTIONS } from './constants';
import { OnboardingFullscreenStep, OnboardingStepIntro } from './OnboardingStepLayout';
import type { OnboardingStepProps } from './types';

export function FrequencyStep({ data, goNext, insets, setValue, theme }: OnboardingStepProps) {
  return (
    <OnboardingFullscreenStep
      footer={<Button label="Continue" onPress={goNext} />}
      insetsBottom={insets.bottom}
    >
      <OnboardingStepIntro title="How often do you train?" subtitle="We'll match you with similar energy." theme={theme} />
      <View style={styles.largeCards}>
        {FREQUENCY_OPTIONS.map((opt) => {
          const selected = data.frequencyLabel === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                setValue('frequencyLabel', opt.key);
                setValue('weeklyFrequencyBand', opt.key);
                setValue('intensityLevel', opt.intensity);
              }}
              style={[
                styles.largeCard,
                {
                  backgroundColor: selected ? theme.primarySubtle : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                  borderWidth: selected ? 2 : 1.5,
                  minHeight: 48,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${opt.label} per week. ${opt.subtitle}`}
              accessibilityHint={selected ? 'Selected' : 'Double tap to choose this training rhythm'}
            >
              <Text style={[styles.largeCardLabel, { color: selected ? theme.primary : theme.textPrimary }]}>
                {opt.label}
              </Text>
              <Text style={[styles.largeCardSub, { color: theme.textSecondary }]}>{opt.subtitle}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFullscreenStep>
  );
}
