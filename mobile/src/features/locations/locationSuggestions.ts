import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EventSummary } from '../../api/types';

export type LocationSuggestionSource = 'recent' | 'known' | 'curated' | 'manual';

export type LocationSuggestion = {
  id: string;
  label: string;
  secondaryLabel?: string;
  value: string;
  latitude?: number;
  longitude?: number;
  source: LocationSuggestionSource;
};

const RECENT_LOCATION_STORAGE_KEY = 'brdg/recent-location-suggestions/v1';
const MAX_RECENT_LOCATION_SUGGESTIONS = 8;

const CURATED_PLACE_SUGGESTIONS: LocationSuggestion[] = [
  createLocationSuggestion('Magic Island, Ala Moana Beach Park', 'Urban beach loop', 'curated'),
  createLocationSuggestion('Diamond Head State Monument', 'Trail and lookout', 'curated'),
  createLocationSuggestion('Kailua Beach Park', 'Beach training spot', 'curated'),
  createLocationSuggestion('Kapiolani Park Sand Courts', 'Beach volleyball', 'curated'),
  createLocationSuggestion('Makapuu Lighthouse Trail', 'Sunrise hike', 'curated'),
  createLocationSuggestion('Salt at Our Kakaako Rooftop', 'Meet-up spot', 'curated'),
  createLocationSuggestion('Ko Olina Lagoons', 'West side swim and walk', 'curated'),
  createLocationSuggestion('Queen’s Beach, Waikiki', 'Beach run and swim', 'curated'),
];

const CURATED_CITY_SUGGESTIONS: LocationSuggestion[] = [
  createLocationSuggestion('Honolulu', 'Oahu', 'curated', { latitude: 21.3099, longitude: -157.8581 }),
  createLocationSuggestion('Kakaako', 'Honolulu neighborhood', 'curated', { latitude: 21.2986, longitude: -157.8576 }),
  createLocationSuggestion('Waikiki', 'Honolulu neighborhood', 'curated', { latitude: 21.2767, longitude: -157.8275 }),
  createLocationSuggestion('Kailua', 'Windward Oahu', 'curated', { latitude: 21.4022, longitude: -157.7394 }),
  createLocationSuggestion('Kaimuki', 'Honolulu neighborhood', 'curated', { latitude: 21.2827, longitude: -157.7969 }),
  createLocationSuggestion('Manoa', 'Honolulu neighborhood', 'curated', { latitude: 21.3214, longitude: -157.8058 }),
  createLocationSuggestion('Pearl City', 'Central Oahu', 'curated', { latitude: 21.3972, longitude: -157.9733 }),
  createLocationSuggestion('Haleiwa', 'North Shore', 'curated', { latitude: 21.5947, longitude: -158.1050 }),
];

export function createLocationSuggestion(
  label: string,
  secondaryLabel: string | undefined,
  source: LocationSuggestionSource,
  coordinates?: Pick<LocationSuggestion, 'latitude' | 'longitude'>,
): LocationSuggestion {
  const value = normalizeLocationValue(label);
  return {
    id: `${source}:${value.toLowerCase()}`,
    label: value,
    secondaryLabel,
    value,
    source,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
  };
}

export function normalizeLocationValue(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function dedupeSuggestions(suggestions: LocationSuggestion[]) {
  const deduped = new Map<string, LocationSuggestion>();
  suggestions.forEach((suggestion) => {
    const key = suggestion.value.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, suggestion);
    }
  });
  return Array.from(deduped.values());
}

export function getCuratedLocationSuggestions(kind: 'place' | 'city') {
  return kind === 'city' ? CURATED_CITY_SUGGESTIONS : CURATED_PLACE_SUGGESTIONS;
}

export function extractKnownLocationSuggestions(events: EventSummary[] = []) {
  return dedupeSuggestions(
    events
      .map((event) => normalizeLocationValue(event.location))
      .filter(Boolean)
      .map((location) => createLocationSuggestion(location, 'Known from BRDG events', 'known')),
  );
}

function getSourceWeight(source: LocationSuggestionSource) {
  switch (source) {
    case 'recent':
      return 300;
    case 'known':
      return 200;
    case 'curated':
      return 100;
    case 'manual':
      return 0;
  }
}

function getQueryWeight(query: string, suggestion: LocationSuggestion) {
  if (!query) return 0;
  const normalizedQuery = query.toLowerCase();
  const haystacks = [
    suggestion.label.toLowerCase(),
    suggestion.value.toLowerCase(),
    suggestion.secondaryLabel?.toLowerCase() ?? '',
  ];
  const bestMatch = haystacks.reduce((score, haystack) => {
    if (!haystack) return score;
    if (haystack === normalizedQuery) return Math.max(score, 120);
    if (haystack.startsWith(normalizedQuery)) return Math.max(score, 90);
    if (haystack.includes(normalizedQuery)) return Math.max(score, 60);
    return score;
  }, 0);
  return bestMatch;
}

export function rankLocationSuggestions(
  query: string,
  suggestions: LocationSuggestion[],
) {
  const normalizedQuery = normalizeLocationValue(query).toLowerCase();
  return dedupeSuggestions(suggestions)
    .filter((suggestion) => {
      if (!normalizedQuery) return true;
      return getQueryWeight(normalizedQuery, suggestion) > 0;
    })
    .sort((left, right) => {
      const scoreDelta =
        getSourceWeight(right.source) +
        getQueryWeight(normalizedQuery, right) -
        (getSourceWeight(left.source) + getQueryWeight(normalizedQuery, left));
      if (scoreDelta !== 0) return scoreDelta;
      return left.label.localeCompare(right.label);
    });
}

export async function loadRecentLocationSuggestions() {
  try {
    const stored = await AsyncStorage.getItem(RECENT_LOCATION_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as LocationSuggestion[];
    return Array.isArray(parsed)
      ? parsed
          .map((suggestion) => ({
            ...suggestion,
            label: normalizeLocationValue(suggestion.label ?? suggestion.value ?? ''),
            value: normalizeLocationValue(suggestion.value ?? suggestion.label ?? ''),
            source: 'recent' as const,
          }))
          .filter((suggestion) => Boolean(suggestion.value))
      : [];
  } catch {
    return [];
  }
}

export async function saveRecentLocationSuggestion(suggestion: LocationSuggestion) {
  const normalizedValue = normalizeLocationValue(suggestion.value);
  if (!normalizedValue) return;

  const nextSuggestion: LocationSuggestion = {
    ...suggestion,
    id: `recent:${normalizedValue.toLowerCase()}`,
    label: normalizeLocationValue(suggestion.label || normalizedValue),
    value: normalizedValue,
    source: 'recent',
  };
  const current = await loadRecentLocationSuggestions();
  const next = dedupeSuggestions([nextSuggestion, ...current]).slice(0, MAX_RECENT_LOCATION_SUGGESTIONS);
  await AsyncStorage.setItem(RECENT_LOCATION_STORAGE_KEY, JSON.stringify(next));
}
