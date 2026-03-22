import type { User } from '../../../api/types';

export { ACTIVITY_OPTIONS, parseFavoriteActivities } from '../../../lib/profile-helpers';

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
  { label: '6-7x / week', value: '6-7' },
  { label: '5+ / week', value: '5+' },
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

export function buildSchedulePreferences(profile?: User['fitnessProfile']) {
  const nextSchedule: string[] = [];
  if (profile?.prefersMorning) nextSchedule.push('Morning');
  if (profile?.prefersEvening) nextSchedule.push('Evening');
  return nextSchedule;
}
