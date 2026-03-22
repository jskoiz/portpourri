import type { User } from '../api/types';

export const ACTIVITY_OPTIONS = [
  { label: '🏃 Running', value: 'Running', color: '#8BAA7A' },
  { label: '🧘 Yoga', value: 'Yoga', color: '#B8A9C4' },
  { label: '🏋️ Lifting', value: 'Lifting', color: '#C97070' },
  { label: '🥾 Hiking', value: 'Hiking', color: '#C4A882' },
  { label: '🏖️ Beach', value: 'Beach', color: '#B8A9C4' },
  { label: '🚴 Cycling', value: 'Cycling', color: '#8BAA7A' },
  { label: '🏄 Surfing', value: 'Surfing', color: '#B8A9C4' },
  { label: '🧗 Climbing', value: 'Climbing', color: '#D4A59A' },
  { label: '🥊 Boxing', value: 'Boxing', color: '#C97070' },
  { label: '🏊 Swimming', value: 'Swimming', color: '#B8A9C4' },
  { label: '🎾 Tennis', value: 'Tennis', color: '#C4A882' },
  { label: '⛷️ Skiing', value: 'Skiing', color: '#B8A9C4' },
];

const ACTIVITY_LABEL_LOOKUP = new Map(
  ACTIVITY_OPTIONS.flatMap(({ label, value }) => {
    const normalized = label.replace(/^[^\p{L}\p{N}]+/u, '').trim();
    return [
      [value.toLowerCase(), value],
      [label.toLowerCase(), value],
      [normalized.toLowerCase(), value],
    ];
  }),
);

function normalizeActivityValue(activity: string) {
  const normalized = activity.trim();
  if (!normalized) return null;
  return ACTIVITY_LABEL_LOOKUP.get(normalized.toLowerCase()) ?? normalized;
}

export function parseFavoriteActivities(favoriteActivities?: string | null) {
  return (favoriteActivities ?? '')
    .split(',')
    .map((activity) => normalizeActivityValue(activity))
    .filter((activity): activity is string => Boolean(activity));
}

const ACTIVITY_TAGS: Record<string, string> = {
  strength: 'Strength',
  weight_loss: 'Conditioning',
  endurance: 'Endurance',
  mobility: 'Mobility',
  connection: 'Connection',
  performance: 'Performance',
  both: 'Open',
};

export function formatProfileLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getActivityTag(user: Record<string, any> | null | undefined): string {
  const goal = user?.fitnessProfile?.primaryGoal;
  if (!goal) return '';
  return ACTIVITY_TAGS[goal] || goal;
}

export function getProfileChips(user: Pick<User, 'fitnessProfile'> | null | undefined): string[] {
  const chips: string[] = [];

  const favoriteActivity = parseFavoriteActivities(user?.fitnessProfile?.favoriteActivities)[0];

  if (favoriteActivity) chips.push(formatProfileLabel(favoriteActivity));
  if (user?.fitnessProfile?.primaryGoal) {
    chips.push(formatProfileLabel(user.fitnessProfile.primaryGoal));
  }
  if (user?.fitnessProfile?.prefersMorning) chips.push('Mornings');
  else if (user?.fitnessProfile?.prefersEvening) chips.push('Evenings');
  else if (user?.fitnessProfile?.weeklyFrequencyBand) {
    chips.push(`${user.fitnessProfile.weeklyFrequencyBand}x/week`);
  }

  return chips.slice(0, 2);
}

export function getIntentLabel(user: Pick<User, 'profile'> | null | undefined): string {
  if (user?.profile?.intentDating && user?.profile?.intentWorkout) return 'Open to both';
  if (user?.profile?.intentDating) return 'Dating';
  if (user?.profile?.intentWorkout) return 'Training';
  return 'Open to both';
}

export function getPresenceLabel(user: Pick<User, 'profile'> | null | undefined): string {
  if (user?.profile?.city) return 'Available tonight';
  return 'Nearby now';
}

export function getTempoLabel(user: Pick<User, 'fitnessProfile'> | null | undefined): string {
  const frequency = user?.fitnessProfile?.weeklyFrequencyBand;
  const intensity = user?.fitnessProfile?.intensityLevel;
  const frequencyLabel = frequency ? `${frequency}x/week` : null;
  const intensityLabel = intensity ? formatProfileLabel(String(intensity).toLowerCase()) : null;

  if (frequencyLabel && intensityLabel) return `${frequencyLabel} · ${intensityLabel}`;
  if (frequencyLabel) return frequencyLabel;
  if (intensityLabel) return intensityLabel;
  return 'Intent-aware match';
}
