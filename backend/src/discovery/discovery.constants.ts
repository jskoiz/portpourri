export const DISCOVERY_FEED_QUERY_LIMIT = 100;
export const DISCOVERY_FEED_RESULT_LIMIT = 20;

export const DISCOVERY_SCORE_WEIGHTS = {
  sharedGoal: 28,
  matchingIntensity: 20,
  unknownDistance: 3,
  ageCenter: 29,
  maxAgeBonus: 12,
  availability: 5,
  photo: 4,
  bio: 3,
} as const;

export const DISCOVERY_DISTANCE_SCORE_TIERS = [
  { maxDistanceKm: 5, score: 25 },
  { maxDistanceKm: 15, score: 18 },
  { maxDistanceKm: 30, score: 10 },
  { maxDistanceKm: 50, score: 4 },
] as const;

export const EARTH_RADIUS_KM = 6371;

export const PROFILE_COMPLETENESS_BIO_MIN_CHARS = 20;
export const PROFILE_COMPLETENESS_PHOTO_MIN_COUNT = 2;

export const PROFILE_COMPLETENESS_PROMPTS = {
  missingProfile: 'Complete your profile setup.',
  firstName: 'Add your first name.',
  birthdate: 'Add your birthday.',
  bio: 'Write a bio (20+ chars) so people know your vibe.',
  city: 'Add your city for better nearby matches.',
  photos: 'Upload at least 2 profile photos.',
  primaryGoal: 'Set a primary fitness goal.',
  intensity: 'Choose your training intensity.',
  availability: 'Set your availability (morning/evening).',
} as const;
