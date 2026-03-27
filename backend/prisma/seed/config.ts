import { createHash } from 'node:crypto';
import { Gender, AuthProvider, IntensityLevel, EventCategory, MessageType } from '@prisma/client';
import { appConfig } from '../../src/config/app.config';

export { Gender, AuthProvider, IntensityLevel, EventCategory, MessageType };

export const BASE_URL = appConfig.seed.assetBaseUrl;
export const DEMO_EMAIL_DOMAIN = 'seed.brdg.app';
export const LEGACY_SEED_EMAILS = [
  'liam@example.com', 'emma@example.com', 'noah@example.com', 'olivia@example.com',
  'william@example.com', 'ava@example.com', 'james@example.com', 'sophia@example.com',
  'benjamin@example.com', 'isabella@example.com', 'lucas@example.com', 'mia@example.com',
];

// ── Types ──────────────────────────────────────────────────────────
export type SeedUser = {
  slug: string;
  firstName: string;
  gender: Gender;
  birthdate: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  bio: string;
  intentDating: boolean;
  intentWorkout: boolean;
  intentFriends: boolean;
  fitness: {
    intensityLevel: IntensityLevel;
    weeklyFrequencyBand: string;
    primaryGoal: string;
    secondaryGoal?: string;
    favoriteActivities: string;
    trainingStyle: string;
    prefersMorning?: boolean;
    prefersEvening?: boolean;
  };
  activities: string[];
  photoCount?: number;
  showMeMen?: boolean;
  showMeWomen?: boolean;
  showMeOther?: boolean;
  maxDistanceKm?: number;
  discoveryPaused?: boolean;
};

export type SeedEvent = {
  slug: string;
  title: string;
  description: string;
  location: string;
  category: EventCategory;
  imageUrl: string;
  hostSlug: string;
  startDayOffset: number;
  startHour: number;
  durationHours: number;
  attendeeSlugs: string[];
};

export type SeedLike = {
  slug: string;
  fromSlug: string;
  toSlug: string;
  dayOffset: number;
  hour: number;
  isSuperLike?: boolean;
};

export type SeedPass = {
  slug: string;
  fromSlug: string;
  toSlug: string;
  dayOffset: number;
  hour: number;
};

export type SeedMatch = {
  slug: string;
  userSlugs: [string, string];
  dayOffset: number;
  hour: number;
  isDatingMatch?: boolean;
  isWorkoutMatch?: boolean;
  isArchived?: boolean;
  isBlocked?: boolean;
  messages: Array<{
    slug: string;
    senderSlug: string;
    body: string;
    hoursAfterMatch: number;
    isRead?: boolean;
  }>;
};

export type SeedEventInvite = {
  slug: string;
  eventSlug: string;
  matchSlug: string;
  inviterSlug: string;
  inviteeSlug: string;
  body: string;
  dayOffset: number;
  hour: number;
};

// ── Helpers ────────────────────────────────────────────────────────
export function demoEmail(slug: string) {
  return `${slug}@${DEMO_EMAIL_DOMAIN}`;
}

export function stableUuid(...parts: string[]) {
  const hash = createHash('sha1').update(parts.join(':')).digest('hex').slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export function buildSeedAnchor(referenceDate = process.env.SEED_NOW_ISO ? new Date(process.env.SEED_NOW_ISO) : new Date()) {
  return new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
      12, 0, 0, 0,
    ),
  );
}

export const SEED_ANCHOR = buildSeedAnchor();

export function buildSeedInstant(dayOffset: number, hour: number, minute = 0) {
  const startsAt = new Date(SEED_ANCHOR);
  startsAt.setUTCDate(startsAt.getUTCDate() + dayOffset);
  startsAt.setUTCHours(hour, minute, 0, 0);
  return startsAt;
}

// ── Activity Catalog ───────────────────────────────────────────────
export const activityCatalog = [
  { slug: 'running', name: 'Running' },
  { slug: 'yoga', name: 'Yoga' },
  { slug: 'strength-training', name: 'Strength Training' },
  { slug: 'surfing', name: 'Surfing' },
  { slug: 'hiking', name: 'Hiking' },
  { slug: 'pilates', name: 'Pilates' },
  { slug: 'swimming', name: 'Swimming' },
  { slug: 'boxing', name: 'Boxing' },
  { slug: 'cycling', name: 'Cycling' },
  { slug: 'volleyball', name: 'Volleyball' },
  { slug: 'paddling', name: 'Paddling' },
  { slug: 'climbing', name: 'Climbing' },
  { slug: 'mobility', name: 'Mobility' },
  { slug: 'dance', name: 'Dance' },
];
