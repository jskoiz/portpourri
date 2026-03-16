import type { EventSummary } from '../../../api/types';

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

export const WHEN_OPTIONS = ['Today', 'Tomorrow', 'This Weekend', 'Next Week'] as const;
export const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening'] as const;
export const SKILL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export function buildStartDate(selectedWhen: string, selectedTime: string) {
  const now = new Date();
  const start = new Date(now);

  if (selectedWhen === 'Tomorrow') {
    start.setDate(start.getDate() + 1);
  } else if (selectedWhen === 'This Weekend') {
    const currentDay = start.getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;
    if (!isWeekend) {
      const daysUntilSaturday = (6 - currentDay + 7) % 7;
      start.setDate(start.getDate() + daysUntilSaturday);
    }
  } else if (selectedWhen === 'Next Week') {
    const currentDay = start.getDay();
    const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay;
    start.setDate(start.getDate() + daysUntilNextMonday);
  }

  if (selectedTime === 'Morning') {
    start.setHours(9, 0, 0, 0);
  } else if (selectedTime === 'Afternoon') {
    start.setHours(14, 0, 0, 0);
  } else {
    start.setHours(18, 0, 0, 0);
  }

  if (start <= now) {
    start.setDate(start.getDate() + 1);
  }

  return start;
}

export function buildTitle(activity: string, where: string) {
  return where.trim() ? `${activity} at ${where.trim()}` : `${activity} meetup`;
}

export function buildDescription({
  note,
  selectedTime,
  selectedWhen,
  skillLevel,
  spots,
}: {
  note: string;
  selectedTime: string;
  selectedWhen: string;
  skillLevel: string | null;
  spots: number;
}) {
  const parts = [
    note.trim(),
    skillLevel ? `Skill level: ${skillLevel}.` : null,
    `Open spots: ${spots}.`,
    `${selectedWhen} ${selectedTime.toLowerCase()}.`,
  ].filter(Boolean);

  return parts.join(' ');
}

export function formatCreatedEventMeta(event: EventSummary) {
  return new Date(event.startsAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

