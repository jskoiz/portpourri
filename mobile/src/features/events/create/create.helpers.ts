/**
 * Maps activity display labels to the backend EventCategory enum values.
 * The backend expects UPPERCASE enum values (e.g. "YOGA", "RUNNING").
 */
export const ACTIVITY_TO_CATEGORY: Record<string, string> = {
  Run: 'RUNNING',
  Yoga: 'YOGA',
  Lift: 'FITNESS',
  Hike: 'HIKING',
  Beach: 'FITNESS',
  Cycle: 'CYCLING',
  Surf: 'SURFING',
  Climb: 'CLIMBING',
  Box: 'BOXING',
  Swim: 'SWIMMING',
  Paddle: 'PADDLING',
  Dance: 'DANCE',
  Pilates: 'PILATES',
} as const;

export const ACTIVITY_TYPES = [
  { icon: 'activity', label: 'Run', color: '#8BAA7A' },
  { icon: 'circle', label: 'Yoga', color: '#B8A9C4' },
  { icon: 'activity', label: 'Lift', color: '#D4A59A' },
  { icon: 'map', label: 'Hike', color: '#C4A882' },
  { icon: 'sun', label: 'Beach', color: '#B8A9C4' },
  { icon: 'navigation', label: 'Cycle', color: '#8BAA7A' },
  { icon: 'wind', label: 'Surf', color: '#B8A9C4' },
  { icon: 'triangle', label: 'Climb', color: '#C4A882' },
  { icon: 'target', label: 'Box', color: '#D4A59A' },
  { icon: 'droplet', label: 'Swim', color: '#B8A9C4' },
] as const;

export function activityToCategory(label: string): string | undefined {
  return ACTIVITY_TO_CATEGORY[label];
}

export function buildTitle(activity: string, where: string) {
  return where.trim() ? `${activity} at ${where.trim()}` : `${activity} meetup`;
}
