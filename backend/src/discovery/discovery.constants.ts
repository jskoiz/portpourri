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

interface CompletenessCheckUser {
  firstName: string | null;
  birthdate: Date | null;
  profile: {
    bio: string | null;
    city: string | null;
  } | null;
  fitnessProfile: {
    primaryGoal: string | null;
    intensityLevel: string | null;
    prefersMorning: boolean | null;
    prefersEvening: boolean | null;
  } | null;
  photos: unknown[];
}

export const PROFILE_COMPLETENESS_CHECKS: ReadonlyArray<{
  field: string;
  label: string;
  route: string;
  prompt: string;
  test: (user: CompletenessCheckUser) => boolean;
}> = [
  {
    field: 'firstName',
    label: 'Add your first name',
    route: 'EditProfile',
    prompt: PROFILE_COMPLETENESS_PROMPTS.firstName,
    test: (user) => !!user.firstName,
  },
  {
    field: 'birthdate',
    label: 'Add your birthday',
    route: 'EditProfile',
    prompt: PROFILE_COMPLETENESS_PROMPTS.birthdate,
    test: (user) => !!user.birthdate,
  },
  {
    field: 'bio',
    label: 'Add a bio',
    route: 'EditProfile',
    prompt: PROFILE_COMPLETENESS_PROMPTS.bio,
    test: (user) =>
      !!user.profile?.bio &&
      user.profile.bio.length >= PROFILE_COMPLETENESS_BIO_MIN_CHARS,
  },
  {
    field: 'city',
    label: 'Set your city',
    route: 'EditProfile',
    prompt: PROFILE_COMPLETENESS_PROMPTS.city,
    test: (user) => !!user.profile?.city,
  },
  {
    field: 'photos',
    label: 'Add more photos',
    route: 'EditPhotos',
    prompt: PROFILE_COMPLETENESS_PROMPTS.photos,
    test: (user) => user.photos.length >= PROFILE_COMPLETENESS_PHOTO_MIN_COUNT,
  },
  {
    field: 'primaryGoal',
    label: 'Set a fitness goal',
    route: 'EditFitness',
    prompt: PROFILE_COMPLETENESS_PROMPTS.primaryGoal,
    test: (user) => !!user.fitnessProfile?.primaryGoal,
  },
  {
    field: 'intensityLevel',
    label: 'Choose your intensity',
    route: 'EditFitness',
    prompt: PROFILE_COMPLETENESS_PROMPTS.intensity,
    test: (user) => !!user.fitnessProfile?.intensityLevel,
  },
  {
    field: 'availability',
    label: 'Set your availability',
    route: 'EditFitness',
    prompt: PROFILE_COMPLETENESS_PROMPTS.availability,
    test: (user) =>
      !!(user.fitnessProfile?.prefersMorning || user.fitnessProfile?.prefersEvening),
  },
];
