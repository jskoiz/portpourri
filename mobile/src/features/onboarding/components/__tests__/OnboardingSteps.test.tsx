import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { lightTheme } from '../../../../theme/tokens';
import { ActivitiesStep } from '../ActivitiesStep';
import { EnvironmentStep } from '../EnvironmentStep';
import { FrequencyStep } from '../FrequencyStep';
import { IntentStep } from '../IntentStep';
import { ReadyStep } from '../ReadyStep';
import { ScheduleStep } from '../ScheduleStep';
import { SocialStep } from '../SocialStep';
import { SummaryStep } from '../SummaryStep';
import { WelcomeStep } from '../WelcomeStep';
import type { OnboardingData } from '../types';

const insets = { top: 0, right: 0, bottom: 0, left: 0 };

const baseData: OnboardingData = {
  intent: 'both',
  activities: [],
  frequencyLabel: '3-4',
  intensityLevel: 'moderate',
  weeklyFrequencyBand: '3-4',
  environment: [],
  schedule: [],
  socialComfort: '',
};

const toggleArray = (items: string[], key: string) => (items.includes(key) ? items.filter((item) => item !== key) : [...items, key]);

describe('onboarding steps', () => {
  it('advances from the welcome step', () => {
    const goNext = jest.fn();

    render(<WelcomeStep goNext={goNext} insets={insets} theme={lightTheme} />);

    fireEvent.press(screen.getByText('Get started'));

    expect(goNext).toHaveBeenCalled();
  });

  it('updates the selected intent and radio state', () => {
    const setValue = jest.fn();

    render(
      <IntentStep
        data={baseData}
        goNext={jest.fn()}
        insets={insets}
        setValue={setValue}
        theme={lightTheme}
        toggleArray={toggleArray}
      />,
    );

    expect(screen.getByLabelText('Training Partner. Find your perfect training companion').props.accessibilityHint).toBe('Double tap to choose this option');
    fireEvent.press(screen.getByLabelText('Training Partner. Find your perfect training companion'));

    expect(setValue).toHaveBeenCalledWith('intent', 'workout');
  });

  it('toggles activities and gates the continue action until one is selected', () => {
    const setValue = jest.fn();

    render(
      <ActivitiesStep
        data={baseData}
        goNext={jest.fn()}
        insets={insets}
        setValue={setValue}
        theme={lightTheme}
        toggleArray={toggleArray}
      />,
    );

    fireEvent.press(screen.getByLabelText('Lifting'));

    expect(setValue).toHaveBeenCalledWith('activities', ['lifting']);
    expect(screen.getByLabelText('Continue').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('syncs the frequency fields from a single choice', () => {
    const setValue = jest.fn();

    render(
      <FrequencyStep
        data={baseData}
        goNext={jest.fn()}
        insets={insets}
        setValue={setValue}
        theme={lightTheme}
        toggleArray={toggleArray}
      />,
    );

    fireEvent.press(screen.getByLabelText('5–6x per week. Dedicated'));

    expect(setValue).toHaveBeenNthCalledWith(1, 'frequencyLabel', '5-6');
    expect(setValue).toHaveBeenNthCalledWith(2, 'weeklyFrequencyBand', '5-6');
    expect(setValue).toHaveBeenNthCalledWith(3, 'intensityLevel', 'high');
  });

  it('updates the social preference and button label', () => {
    const setValue = jest.fn();

    render(
      <SocialStep
        data={baseData}
        goNext={jest.fn()}
        insets={insets}
        setValue={setValue}
        theme={lightTheme}
        toggleArray={toggleArray}
      />,
    );

    fireEvent.press(screen.getByLabelText('Small Group. 3–5 people, tight-knit'));

    expect(setValue).toHaveBeenCalledWith('socialComfort', 'small-group');
    expect(screen.getByLabelText('Continue').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('renders the summary and ready states', () => {
    render(
      <SummaryStep
        data={{
          ...baseData,
          intent: 'workout',
          activities: ['lifting', 'running'],
          environment: ['gym', 'outdoors'],
          schedule: ['morning'],
          socialComfort: '1-on-1',
        }}
        insets={insets}
        onNext={jest.fn()}
        theme={lightTheme}
      />,
    );

    expect(screen.getByText('Training')).toBeTruthy();
    expect(screen.getByText('Lifting · Running')).toBeTruthy();

    const pulseAnim = new Animated.Value(1);
    const submitOnboarding = jest.fn();

    render(
      <ReadyStep
        insets={insets}
        isSubmitting
        pulseAnim={pulseAnim}
        submitOnboarding={submitOnboarding}
        theme={lightTheme}
      />,
    );

    expect(screen.getByLabelText('Setting up your profile…').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true, busy: true }),
    );

    render(
      <ReadyStep
        insets={insets}
        isSubmitting={false}
        pulseAnim={pulseAnim}
        submitOnboarding={submitOnboarding}
        theme={lightTheme}
      />,
    );

    fireEvent.press(screen.getByLabelText('Meet them now'));

    expect(submitOnboarding).toHaveBeenCalled();
  });
});
