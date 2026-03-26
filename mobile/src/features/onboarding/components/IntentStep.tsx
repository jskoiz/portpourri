import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../../../design/primitives';
import AppIcon from '../../../components/ui/AppIcon';
import { styles } from '../onboarding.styles';
import { OnboardingFullscreenStep, OnboardingStepIntro } from './OnboardingStepLayout';
import type { OnboardingStepProps } from './types';

const INTENT_OPTIONS = [
  { key: 'dating', icon: 'heart', title: 'Dating', sub: 'Meet someone special through shared movement' },
  { key: 'workout', icon: 'activity', title: 'Training Partner', sub: 'Find your perfect training companion' },
  { key: 'both', icon: 'shuffle', title: 'Open to both', sub: 'Keep it open to chemistry and momentum.' },
] as const;

export function IntentStep({ data, goNext, insets, setValue, theme }: OnboardingStepProps) {
  return (
    <OnboardingFullscreenStep
      footer={<Button label="Continue" onPress={goNext} />}
      insetsBottom={insets.bottom}
      scrollable
    >
      <OnboardingStepIntro title="What brings you to BRDG?" subtitle="This helps us personalize your feed." theme={theme} />
        <View style={styles.intentCards}>
          {INTENT_OPTIONS.map((opt) => {
            const selected = data.intent === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setValue('intent', opt.key)}
                style={[
                  styles.intentCard,
                  {
                    backgroundColor: selected ? theme.primarySubtle : theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                    borderWidth: selected ? 2 : 1.5,
                    minHeight: 56,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${opt.title}. ${opt.sub}`}
                accessibilityHint={selected ? 'Selected' : 'Double tap to choose this option'}
              >
                <View style={[styles.intentCardIconWrap, { backgroundColor: selected ? theme.primarySubtle : theme.surfaceElevated }]}>
                  <AppIcon name={opt.icon} size={18} color={selected ? theme.primary : theme.textSecondary} />
                </View>
                <Text style={[styles.intentCardTitle, { color: selected ? theme.primary : theme.textPrimary }]}>
                  {opt.title}
                </Text>
                <Text style={[styles.intentCardSub, { color: theme.textSecondary }]}>{opt.sub}</Text>
              </Pressable>
            );
          })}
        </View>
    </OnboardingFullscreenStep>
  );
}
