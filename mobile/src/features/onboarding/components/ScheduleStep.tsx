import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../../../design/primitives';
import AppIcon from '../../../components/ui/AppIcon';
import { styles } from '../onboarding.styles';
import { SCHEDULE_OPTIONS } from './constants';
import { OnboardingFullscreenStep, OnboardingStepIntro } from './OnboardingStepLayout';
import type { OnboardingStepProps } from './types';

export function ScheduleStep({ data, goNext, insets, setValue, theme, toggleArray }: OnboardingStepProps) {
  return (
    <OnboardingFullscreenStep
      footer={<Button label="Continue" onPress={goNext} disabled={data.schedule.length === 0} />}
      insetsBottom={insets.bottom}
    >
      <OnboardingStepIntro title="When do you prefer to move?" subtitle="Select all that apply." theme={theme} />
      <View style={styles.largeCards}>
        {SCHEDULE_OPTIONS.map((opt) => {
          const selected = data.schedule.includes(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => setValue('schedule', toggleArray(data.schedule, opt.key))}
              style={[
                styles.scheduleCard,
                {
                  backgroundColor: selected ? theme.accentSubtle : theme.surface,
                  borderColor: selected ? theme.accent : theme.border,
                  borderWidth: selected ? 2 : 1.5,
                  minHeight: 48,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={opt.label}
              accessibilityHint={selected ? 'Selected' : 'Double tap to toggle'}
            >
              <View style={[styles.scheduleIconWrap, { backgroundColor: selected ? theme.accentSubtle : theme.surfaceElevated }]}>
                <AppIcon name={opt.icon} size={16} color={selected ? theme.accent : theme.textSecondary} />
              </View>
              <Text style={[styles.largeCardLabel, { color: selected ? theme.accent : theme.textPrimary }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFullscreenStep>
  );
}
