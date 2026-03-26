import type { Meta, StoryObj } from '@storybook/react-native';
import React, { useRef } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import {
  ActivitiesStep,
  EnvironmentStep,
  FrequencyStep,
  IntentStep,
  ReadyStep,
  ScheduleStep,
  SocialStep,
  SummaryStep,
  WelcomeStep,
} from '../features/onboarding/components';
import type { OnboardingData } from '../features/onboarding/components';
import { lightTheme } from '../theme/tokens';
import { withStoryScreenFrame } from './support';

type OnboardingStepName =
  | 'welcome'
  | 'intent'
  | 'activities'
  | 'frequency'
  | 'environment'
  | 'schedule'
  | 'social'
  | 'summary'
  | 'ready';

const insets = { top: 0, right: 0, bottom: 0, left: 0 };

const sampleData: OnboardingData = {
  intent: 'both',
  activities: ['lifting', 'running'],
  frequencyLabel: '3-4',
  intensityLevel: 'moderate',
  weeklyFrequencyBand: '3-4',
  environment: ['gym', 'outdoors'],
  schedule: ['morning', 'weekends'],
  socialComfort: 'small-group',
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        gap: 16,
        padding: 20,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.86)',
        borderWidth: 1,
        borderColor: '#E8E2DA',
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1.4, color: '#8B7A9C' }}>
          ONBOARDING
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#2C2420' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function OnboardingStepsStory({ step }: { step: OnboardingStepName }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  return (
    <ScrollView
      contentContainerStyle={{
        gap: 18,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: lightTheme.background,
      }}
      showsVerticalScrollIndicator={false}
    >
      {step === 'welcome' && (
        <Section title="Welcome step">
          <View style={{ height: 620 }}>
            <WelcomeStep goNext={() => undefined} insets={insets} theme={lightTheme} />
          </View>
        </Section>
      )}

      {step === 'intent' && (
        <Section title="Intent step">
          <IntentStep
            data={sampleData}
            goNext={() => undefined}
            insets={insets}
            setValue={() => undefined}
            theme={lightTheme}
            toggleArray={(items, key) => (items.includes(key) ? items.filter((item) => item !== key) : [...items, key])}
          />
        </Section>
      )}

      {step === 'activities' && (
        <Section title="Activities step">
          <ActivitiesStep
            data={sampleData}
            goNext={() => undefined}
            insets={insets}
            setValue={() => undefined}
            theme={lightTheme}
            toggleArray={(items, key) => (items.includes(key) ? items.filter((item) => item !== key) : [...items, key])}
          />
        </Section>
      )}

      {step === 'frequency' && (
        <Section title="Frequency step">
          <FrequencyStep
            data={sampleData}
            goNext={() => undefined}
            insets={insets}
            setValue={() => undefined}
            theme={lightTheme}
            toggleArray={() => []}
          />
        </Section>
      )}

      {step === 'environment' && (
        <Section title="Environment step">
          <EnvironmentStep
            data={sampleData}
            goNext={() => undefined}
            insets={insets}
            setValue={() => undefined}
            theme={lightTheme}
            toggleArray={(items, key) => (items.includes(key) ? items.filter((item) => item !== key) : [...items, key])}
          />
        </Section>
      )}

      {step === 'schedule' && (
        <Section title="Schedule step">
          <ScheduleStep
            data={sampleData}
            goNext={() => undefined}
            insets={insets}
            setValue={() => undefined}
            theme={lightTheme}
            toggleArray={(items, key) => (items.includes(key) ? items.filter((item) => item !== key) : [...items, key])}
          />
        </Section>
      )}

      {step === 'social' && (
        <Section title="Social step">
          <SocialStep
            data={sampleData}
            goNext={() => undefined}
            insets={insets}
            setValue={() => undefined}
            theme={lightTheme}
            toggleArray={() => []}
          />
        </Section>
      )}

      {step === 'summary' && (
        <Section title="Summary step">
          <SummaryStep data={sampleData} insets={insets} onNext={() => undefined} theme={lightTheme} />
        </Section>
      )}

      {step === 'ready' && (
        <Section title="Ready step">
          <View style={{ height: 700 }}>
            <ReadyStep
              insets={insets}
              isSubmitting={false}
              pulseAnim={pulseAnim}
              submitOnboarding={() => undefined}
              theme={lightTheme}
            />
          </View>
        </Section>
      )}

      <Text style={{ color: '#6B6159', fontSize: 12, lineHeight: 18 }}>
        Each preview uses the same warm onboarding palette and sample state that the live screen
        starts with.
      </Text>
    </ScrollView>
  );
}

const meta = {
  title: 'Onboarding/Steps',
  component: OnboardingStepsStory,
  decorators: [withStoryScreenFrame({ centered: false, height: 920 })],
  args: {
    step: 'welcome',
  },
} satisfies Meta<typeof OnboardingStepsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Welcome: Story = {};

export const Intent: Story = {
  args: {
    step: 'intent',
  },
};

export const Activities: Story = {
  args: {
    step: 'activities',
  },
};

export const Frequency: Story = {
  args: {
    step: 'frequency',
  },
};

export const Environment: Story = {
  args: {
    step: 'environment',
  },
};

export const Schedule: Story = {
  args: {
    step: 'schedule',
  },
};

export const Social: Story = {
  args: {
    step: 'social',
  },
};

export const Summary: Story = {
  args: {
    step: 'summary',
  },
};

export const Ready: Story = {
  args: {
    step: 'ready',
  },
};
