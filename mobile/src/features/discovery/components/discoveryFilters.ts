import type { User } from '../../../api/types';
import type { DiscoveryFiltersInput } from '../../../services/api';
import type { SessionIntent } from '../../../types/sessionIntent';

export type QuickFilterKey =
  | 'all'
  | 'strength'
  | 'endurance'
  | 'mobility'
  | 'morning'
  | 'evening';

export type FilterModalState = {
  availability: Array<'morning' | 'evening'>;
  distanceKm: string;
  goals: string[];
  intensity: string[];
  maxAge: string;
  minAge: string;
};

export const INTENT_OPTIONS: Array<{
  value: SessionIntent;
  label: string;
  color: string;
}> = [
  { value: 'dating', label: 'Dating', color: '#D4A59A' },
  { value: 'workout', label: 'Training', color: '#B8A9C4' },
  { value: 'both', label: 'Open to both', color: '#8BAA7A' },
];

export const goalOptions = ['strength', 'weight_loss', 'endurance', 'mobility'];
export const intensityOptions = ['low', 'moderate', 'high'];
export const availabilityOptions: Array<'morning' | 'evening'> = ['morning', 'evening'];

export const QUICK_FILTERS: Array<{
  id: QuickFilterKey;
  label: string;
  goals?: string[];
  availability?: Array<'morning' | 'evening'>;
}> = [
  { id: 'all', label: 'All' },
  { id: 'strength', label: 'Strength', goals: ['strength'] },
  { id: 'endurance', label: 'Endurance', goals: ['endurance'] },
  { id: 'mobility', label: 'Mobility', goals: ['mobility'] },
  { id: 'morning', label: 'Morning', availability: ['morning'] },
  { id: 'evening', label: 'Evening', availability: ['evening'] },
];

export function getGreeting(name?: string) {
  const hour = new Date().getHours();
  const timeWord = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${timeWord}${name ? `, ${name}` : ''}`;
}

function mergeUnique<T extends string>(values: T[]) {
  return Array.from(new Set(values));
}

export function getUserIntent(user?: User | null): SessionIntent {
  if (user?.profile?.intentDating && user?.profile?.intentWorkout) return 'both';
  if (user?.profile?.intentDating) return 'dating';
  if (user?.profile?.intentWorkout) return 'workout';
  return 'both';
}

export function buildDiscoveryFilters(
  activeQuickFilter: QuickFilterKey,
  modalState: FilterModalState,
): DiscoveryFiltersInput {
  const quickFilter = QUICK_FILTERS.find((item) => item.id === activeQuickFilter);
  const resolvedGoals = mergeUnique([...(modalState.goals || []), ...(quickFilter?.goals || [])]);
  const resolvedAvailability = mergeUnique([
    ...(modalState.availability || []),
    ...(quickFilter?.availability || []),
  ]);

  return {
    distanceKm: Number(modalState.distanceKm) || undefined,
    minAge: Number(modalState.minAge) || undefined,
    maxAge: Number(modalState.maxAge) || undefined,
    goals: resolvedGoals.length ? resolvedGoals : undefined,
    intensity: modalState.intensity.length ? modalState.intensity : undefined,
    availability: resolvedAvailability.length ? resolvedAvailability : undefined,
  };
}

export function countActiveFilters(
  currentFilters: DiscoveryFiltersInput,
  modalState: FilterModalState,
) {
  return (
    (currentFilters.goals?.length || 0) +
    (currentFilters.intensity?.length || 0) +
    (currentFilters.availability?.length || 0) +
    (modalState.distanceKm !== '50' ? 1 : 0) +
    (modalState.minAge !== '21' ? 1 : 0) +
    (modalState.maxAge !== '45' ? 1 : 0)
  );
}

