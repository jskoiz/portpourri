import type { User } from '../../../api/types';

export const ACTIVITY_OPTIONS = [
  { label: '🏃 Running', value: 'Running', color: '#34D399' },
  { label: '🧘 Yoga', value: 'Yoga', color: '#7C6AF7' },
  { label: '🏋️ Lifting', value: 'Lifting', color: '#F87171' },
  { label: '🥾 Hiking', value: 'Hiking', color: '#F59E0B' },
  { label: '🏖️ Beach', value: 'Beach', color: '#60A5FA' },
  { label: '🚴 Cycling', value: 'Cycling', color: '#34D399' },
  { label: '🏄 Surfing', value: 'Surfing', color: '#38BDF8' },
  { label: '🧗 Climbing', value: 'Climbing', color: '#FB923C' },
  { label: '🥊 Boxing', value: 'Boxing', color: '#F87171' },
  { label: '🏊 Swimming', value: 'Swimming', color: '#60A5FA' },
  { label: '🎾 Tennis', value: 'Tennis', color: '#F59E0B' },
  { label: '⛷️ Skiing', value: 'Skiing', color: '#93C5FD' },
];

export const SCHEDULE_OPTIONS = ['Morning', 'Midday', 'Afternoon', 'Evening', 'Weekends'];
export const ENVIRONMENT_OPTIONS = ['Outdoors', 'Gym', 'Home', 'Studio', 'Pool'];
export const INTENSITY_OPTIONS = [
  { label: 'Low', value: 'low', description: 'Casual pace, lighter sessions.' },
  { label: 'Moderate', value: 'moderate', description: 'Consistent effort without going full-send every day.' },
  { label: 'High', value: 'high', description: 'Hard training, strong conditioning, or serious volume.' },
];
export const WEEKLY_FREQUENCY_OPTIONS = [
  { label: '1-2x / week', value: '1-2' },
  { label: '2-3x / week', value: '2-3' },
  { label: '3-4x / week', value: '3-4' },
  { label: '4-5x / week', value: '4-5' },
  { label: '5+ / week', value: '5+' },
  { label: '6-7x / week', value: '6-7' },
];
export const PRIMARY_GOAL_OPTIONS = [
  { label: 'Health', value: 'health' },
  { label: 'Connection', value: 'connection' },
  { label: 'Strength', value: 'strength' },
  { label: 'Endurance', value: 'endurance' },
  { label: 'Mobility', value: 'mobility' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Conditioning', value: 'conditioning' },
  { label: 'Skill', value: 'skill' },
  { label: 'Fun', value: 'fun' },
  { label: 'Hypertrophy', value: 'hypertrophy' },
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

export function buildSchedulePreferences(profile?: User['fitnessProfile']) {
  const nextSchedule: string[] = [];
  if (profile?.prefersMorning) nextSchedule.push('Morning');
  if (profile?.prefersEvening) nextSchedule.push('Evening');
  return nextSchedule;
}
