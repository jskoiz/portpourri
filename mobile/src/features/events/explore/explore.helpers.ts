import type { EventSummary } from '../../../api/types';
import { ACTIVITY_SPOTS, GYM_EVENT_KEYWORDS, TRAIL_EVENT_KEYWORDS, type ExploreCategory } from './explore.data';

export function getEventSearchText(event: EventSummary) {
  return `${event.category ?? ''} ${event.title} ${event.location}`.toLowerCase();
}

function matchesEventKeyword(event: EventSummary, keywords: string[]) {
  const haystack = getEventSearchText(event);
  return keywords.some((keyword) => haystack.includes(keyword));
}

export function matchesEventCategory(event: EventSummary, activeCategory: ExploreCategory) {
  switch (activeCategory) {
    case 'Trails':
      return matchesEventKeyword(event, TRAIL_EVENT_KEYWORDS);
    case 'Gyms':
      return matchesEventKeyword(event, GYM_EVENT_KEYWORDS);
    case 'Spots':
    case 'Community':
      return false;
    default:
      return true;
  }
}

export function matchesSpotCategory(spot: (typeof ACTIVITY_SPOTS)[number], activeCategory: ExploreCategory) {
  switch (activeCategory) {
    case 'Spots':
    case 'All':
      return true;
    case 'Trails':
      return spot.tags.includes('Trails');
    case 'Gyms':
      return spot.tags.includes('Gyms');
    default:
      return false;
  }
}

export function getEventSectionTitle(activeCategory: ExploreCategory) {
  switch (activeCategory) {
    case 'Trails':
      return 'Trail Events';
    case 'Gyms':
      return 'Gym Events';
    default:
      return 'Near You';
  }
}

export function getEventEmptyDescription(activeCategory: ExploreCategory) {
  switch (activeCategory) {
    case 'Trails':
      return 'No trail-oriented events are live right now. Try again after a refresh.';
    case 'Gyms':
      return 'No gym-based events are live right now. Try again after a refresh.';
    default:
      return 'Create the first plan nearby or check back after a refresh.';
  }
}

export function getSpotsSectionTitle(activeCategory: ExploreCategory) {
  switch (activeCategory) {
    case 'Trails':
      return 'Trail Spots';
    case 'Gyms':
      return 'Training Spaces';
    default:
      return 'Activity Spots';
  }
}

export function getEventMeta(event: EventSummary) {
  const category = event.category?.toLowerCase() ?? '';
  if (category.includes('run')) return { icon: 'navigation' as const, gradientColors: ['#34D399', '#059669'] as const };
  if (category.includes('yoga')) return { icon: 'sun' as const, gradientColors: ['#7C6AF7', '#4B3EBF'] as const };
  if (category.includes('hike')) return { icon: 'map' as const, gradientColors: ['#F59E0B', '#D97706'] as const };
  if (category.includes('surf') || category.includes('swim')) return { icon: 'wind' as const, gradientColors: ['#7AA8B8', '#4D6C78'] as const };
  return { icon: 'calendar' as const, gradientColors: ['#7C6AF7', '#F59E0B'] as const };
}

export function formatEventDate(startsAt: string) {
  const start = new Date(startsAt);
  return start.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

