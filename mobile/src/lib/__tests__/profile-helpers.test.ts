import {
  formatProfileLabel,
  getActivityTag,
  getIntentLabel,
  getPresenceLabel,
  getProfileChips,
  getTempoLabel,
} from '../profile-helpers';

describe('profile-helpers', () => {
  it('maps known activity goals to their editorial labels', () => {
    expect(getActivityTag({ fitnessProfile: { primaryGoal: 'weight_loss' } })).toBe('Conditioning');
    expect(getActivityTag({ fitnessProfile: { primaryGoal: 'custom_goal' } })).toBe('custom_goal');
    expect(getActivityTag({})).toBe('');
  });

  it('formats snake_case labels into title case', () => {
    expect(formatProfileLabel('improve_upper_body')).toBe('Improve Upper Body');
  });

  it('builds profile chips in priority order and caps the list at two items', () => {
    expect(
      getProfileChips({
        fitnessProfile: {
          favoriteActivities: 'trail_run, yoga',
          primaryGoal: 'endurance',
          prefersMorning: true,
        },
      }),
    ).toEqual(['Trail Run', 'Endurance']);
  });

  it('falls back to schedule or frequency labels when activity chips are absent', () => {
    expect(
      getProfileChips({
        fitnessProfile: {
          prefersEvening: true,
          weeklyFrequencyBand: '4',
        },
      }),
    ).toEqual(['Evenings']);

    expect(
      getProfileChips({
        fitnessProfile: {
          weeklyFrequencyBand: '4',
        },
      }),
    ).toEqual(['4x/week']);
  });

  it('derives intent and presence labels from the profile payload', () => {
    expect(getIntentLabel({ profile: { intentDating: true, intentWorkout: true } })).toBe('Open to both');
    expect(getIntentLabel({ profile: { intentDating: false, intentWorkout: true } })).toBe('Training');
    expect(getPresenceLabel({ profile: { city: 'Honolulu' } })).toBe('Available tonight');
    expect(getPresenceLabel({ profile: {} })).toBe('Nearby now');
  });

  it('derives tempo labels from weekly frequency and intensity', () => {
    expect(
      getTempoLabel({
        fitnessProfile: {
          weeklyFrequencyBand: '3',
          intensityLevel: 'high_energy',
        },
      }),
    ).toBe('3x/week · High Energy');

    expect(getTempoLabel({ fitnessProfile: { weeklyFrequencyBand: '2' } })).toBe('2x/week');
    expect(getTempoLabel({ fitnessProfile: {} })).toBe('Intent-aware match');
  });
});
