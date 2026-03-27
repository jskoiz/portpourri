import type { User } from '../api/types';
import { normalizeActivityValue } from '../constants/activities';

export { ACTIVITY_OPTIONS } from '../constants/activities';

export function formatProfileLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export function getIntentLabels(user: Pick<User, 'profile'> | null | undefined): string[] {
  const labels: string[] = [];

  if (user?.profile?.intentDating) labels.push('Dating');
  if (user?.profile?.intentWorkout) labels.push('Training');
  if (user?.profile?.intentFriends) labels.push('Friends');

  return labels;
}

export function getIntentLabel(user: Pick<User, 'profile'> | null | undefined): string {
  const labels = getIntentLabels(user);

  if (labels.length === 0) return 'Intent not set';
  if (labels.length === 1) return labels[0];
  return `${labels.length} intents`;
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
