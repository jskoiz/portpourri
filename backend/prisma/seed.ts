import { PrismaClient, Gender, AuthProvider, IntensityLevel, EventCategory } from '@prisma/client';
import { appConfig } from '../src/config/app.config';

const prisma = new PrismaClient();

const BASE_URL = appConfig.seed.assetBaseUrl;
const DEMO_EMAIL_DOMAIN = 'seed.brdg.app';
const LEGACY_SEED_EMAILS = [
  'liam@example.com',
  'emma@example.com',
  'noah@example.com',
  'olivia@example.com',
  'william@example.com',
  'ava@example.com',
  'james@example.com',
  'sophia@example.com',
  'benjamin@example.com',
  'isabella@example.com',
  'lucas@example.com',
  'mia@example.com',
];
const PHOTO_FILES = [
  'uifaces-human-avatar.jpg',
  'uifaces-human-avatar (1).jpg',
  'uifaces-human-avatar (2).jpg',
  'uifaces-human-avatar (3).jpg',
  'uifaces-human-avatar (4).jpg',
  'uifaces-human-avatar (5).jpg',
  'uifaces-popular-avatar.jpg',
  'uifaces-popular-avatar (1).jpg',
  'uifaces-popular-avatar (2).jpg',
  'uifaces-popular-avatar (3).jpg',
  'uifaces-popular-avatar (4).jpg',
  'uifaces-popular-avatar (5).jpg',
];

type SeedUser = {
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
};

type SeedEvent = {
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

const activityCatalog = [
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

const seedUsers: SeedUser[] = [
  {
    slug: 'kai',
    firstName: 'Kai',
    gender: Gender.MALE,
    birthdate: '1994-05-17',
    city: 'Kakaako',
    country: 'USA',
    latitude: 21.2969,
    longitude: -157.8572,
    bio: 'Sunrise run regular, part-time surf chaser, and always down for a coffee walk after a hard session. Best-case week has ocean time, a lower-body lift, and one plan that turns into dinner.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.ADVANCED,
      weeklyFrequencyBand: '5+',
      primaryGoal: 'endurance',
      secondaryGoal: 'strength',
      favoriteActivities: 'Running, Surfing, Strength Training',
      trainingStyle: 'Structured weekday training with flexible weekend adventure plans.',
      prefersMorning: true,
      prefersEvening: false,
    },
    activities: ['running', 'surfing', 'strength-training'],
  },
  {
    slug: 'leilani',
    firstName: 'Leilani',
    gender: Gender.FEMALE,
    birthdate: '1997-08-11',
    city: 'Waikiki',
    country: 'USA',
    latitude: 21.2808,
    longitude: -157.8294,
    bio: 'Hot yoga instructor energy without the chaos. I like beach walks, mobility work, and people who actually make the plan they suggest.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.INTERMEDIATE,
      weeklyFrequencyBand: '4-5',
      primaryGoal: 'mobility',
      secondaryGoal: 'health',
      favoriteActivities: 'Yoga, Pilates, Swimming',
      trainingStyle: 'Mobility-first with low-drama consistency and long cooldowns.',
      prefersMorning: true,
      prefersEvening: true,
    },
    activities: ['yoga', 'pilates', 'swimming', 'mobility'],
  },
  {
    slug: 'mason',
    firstName: 'Mason',
    gender: Gender.MALE,
    birthdate: '1991-02-03',
    city: 'Ala Moana',
    country: 'USA',
    latitude: 21.291,
    longitude: -157.8438,
    bio: 'Former college rower who still likes an honest workout. Looking for a training partner for lifts, paddles, and a weekend event that feels worth waking up for.',
    intentDating: false,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.ADVANCED,
      weeklyFrequencyBand: '5+',
      primaryGoal: 'strength',
      secondaryGoal: 'skill',
      favoriteActivities: 'Strength Training, Paddling, Cycling',
      trainingStyle: 'Heavy compounds during the week and outdoor sessions on weekends.',
      prefersMorning: false,
      prefersEvening: true,
    },
    activities: ['strength-training', 'paddling', 'cycling'],
  },
  {
    slug: 'nia',
    firstName: 'Nia',
    gender: Gender.FEMALE,
    birthdate: '1998-10-26',
    city: 'Manoa',
    country: 'USA',
    latitude: 21.319,
    longitude: -157.8058,
    bio: 'Trail girl with a soft spot for matcha runs and last-minute waterfall detours. I like active dates that end with snacks and no pressure.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.INTERMEDIATE,
      weeklyFrequencyBand: '3-4',
      primaryGoal: 'adventure',
      secondaryGoal: 'endurance',
      favoriteActivities: 'Hiking, Running, Yoga',
      trainingStyle: 'Mix of scenic cardio days, recovery yoga, and one challenge hike per week.',
      prefersMorning: true,
      prefersEvening: false,
    },
    activities: ['hiking', 'running', 'yoga'],
  },
  {
    slug: 'jordan',
    firstName: 'Jordan',
    gender: Gender.MALE,
    birthdate: '1995-12-14',
    city: 'Kaimuki',
    country: 'USA',
    latitude: 21.2834,
    longitude: -157.7997,
    bio: 'Boxing gym regular who still sneaks in a sunset jog when work clears. Here for people who like momentum, banter, and showing up on time.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: false,
    fitness: {
      intensityLevel: IntensityLevel.ADVANCED,
      weeklyFrequencyBand: '4-5',
      primaryGoal: 'conditioning',
      secondaryGoal: 'strength',
      favoriteActivities: 'Boxing, Running, Strength Training',
      trainingStyle: 'Pad rounds, interval blocks, and compact weekday sessions.',
      prefersMorning: false,
      prefersEvening: true,
    },
    activities: ['boxing', 'running', 'strength-training'],
  },
  {
    slug: 'malia',
    firstName: 'Malia',
    gender: Gender.FEMALE,
    birthdate: '1993-07-09',
    city: 'Kailua',
    country: 'USA',
    latitude: 21.3972,
    longitude: -157.7394,
    bio: 'Ocean swims, paddles, and anything that makes Sunday feel extra long. Looking for someone who likes active mornings and easy conversation after.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.INTERMEDIATE,
      weeklyFrequencyBand: '4-5',
      primaryGoal: 'endurance',
      secondaryGoal: 'health',
      favoriteActivities: 'Swimming, Paddling, Surfing',
      trainingStyle: 'Steady endurance work with big emphasis on recovery and beach time.',
      prefersMorning: true,
      prefersEvening: false,
    },
    activities: ['swimming', 'paddling', 'surfing'],
  },
  {
    slug: 'rowan',
    firstName: 'Rowan',
    gender: Gender.MALE,
    birthdate: '1989-11-02',
    city: 'Downtown Honolulu',
    country: 'USA',
    latitude: 21.3099,
    longitude: -157.8581,
    bio: 'Gym rat in a healthy way. I like strong coffee, simple plans, and training blocks with an actual goal attached.',
    intentDating: false,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.ADVANCED,
      weeklyFrequencyBand: '6-7',
      primaryGoal: 'hypertrophy',
      secondaryGoal: 'strength',
      favoriteActivities: 'Strength Training, Mobility, Cycling',
      trainingStyle: 'Progressive overload with a little mobility work to stay useful.',
      prefersMorning: false,
      prefersEvening: true,
    },
    activities: ['strength-training', 'mobility', 'cycling'],
  },
  {
    slug: 'tessa',
    firstName: 'Tessa',
    gender: Gender.FEMALE,
    birthdate: '1996-03-19',
    city: 'Kapahulu',
    country: 'USA',
    latitude: 21.2749,
    longitude: -157.8064,
    bio: 'Pilates, beach volleyball, and the kind of social battery that works better outside. Looking for playful energy, not vague texting.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.INTERMEDIATE,
      weeklyFrequencyBand: '3-4',
      primaryGoal: 'fun',
      secondaryGoal: 'mobility',
      favoriteActivities: 'Pilates, Volleyball, Yoga',
      trainingStyle: 'Balanced week with classes, beach games, and one longer move day.',
      prefersMorning: false,
      prefersEvening: true,
    },
    activities: ['pilates', 'volleyball', 'yoga'],
  },
  {
    slug: 'keoni',
    firstName: 'Keoni',
    gender: Gender.MALE,
    birthdate: '1992-09-21',
    city: 'Hawaii Kai',
    country: 'USA',
    latitude: 21.2778,
    longitude: -157.7047,
    bio: 'Makapuu sunrise hiker, occasional freedive student, and very pro breakfast burrito. I am usually outside before most group chats wake up.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.ADVANCED,
      weeklyFrequencyBand: '5+',
      primaryGoal: 'adventure',
      secondaryGoal: 'endurance',
      favoriteActivities: 'Hiking, Swimming, Surfing',
      trainingStyle: 'Adventure-heavy schedule with conditioning built around ocean days.',
      prefersMorning: true,
      prefersEvening: false,
    },
    activities: ['hiking', 'swimming', 'surfing'],
  },
  {
    slug: 'sasha',
    firstName: 'Sasha',
    gender: Gender.FEMALE,
    birthdate: '1999-01-30',
    city: 'McCully',
    country: 'USA',
    latitude: 21.2922,
    longitude: -157.8313,
    bio: 'Dance cardio, reformer classes, and a low-stakes walk to debrief life after. Here for chemistry, consistency, and people who suggest real plans.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.INTERMEDIATE,
      weeklyFrequencyBand: '3-4',
      primaryGoal: 'health',
      secondaryGoal: 'mobility',
      favoriteActivities: 'Dance, Pilates, Yoga',
      trainingStyle: 'Studio classes during the week and one outside day to reset.',
      prefersMorning: false,
      prefersEvening: true,
    },
    activities: ['dance', 'pilates', 'yoga'],
  },
  {
    slug: 'eli',
    firstName: 'Eli',
    gender: Gender.MALE,
    birthdate: '1997-04-05',
    city: 'Pearl City',
    country: 'USA',
    latitude: 21.3977,
    longitude: -157.9731,
    bio: 'Weekend cyclist, weekday lifter, surprisingly patient with beginners. Looking for a ride partner or somebody who wants a first date that involves movement.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.INTERMEDIATE,
      weeklyFrequencyBand: '4-5',
      primaryGoal: 'strength',
      secondaryGoal: 'endurance',
      favoriteActivities: 'Cycling, Strength Training, Running',
      trainingStyle: 'Short focused weekday lifts and one long ride when the weather cooperates.',
      prefersMorning: true,
      prefersEvening: true,
    },
    activities: ['cycling', 'strength-training', 'running'],
  },
  {
    slug: 'alana',
    firstName: 'Alana',
    gender: Gender.FEMALE,
    birthdate: '1994-12-28',
    city: 'Kakaako',
    country: 'USA',
    latitude: 21.2983,
    longitude: -157.8566,
    bio: 'I split my free time between reformer classes, long walks, and trying new fitness concepts before they get overhyped. Looking for people with warm energy and actual follow-through.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.BEGINNER,
      weeklyFrequencyBand: '2-3',
      primaryGoal: 'health',
      secondaryGoal: 'fun',
      favoriteActivities: 'Pilates, Walking, Yoga',
      trainingStyle: 'Low-pressure consistency with enough variety to keep it fun.',
      prefersMorning: false,
      prefersEvening: true,
    },
    activities: ['pilates', 'yoga', 'mobility'],
  },
  {
    slug: 'devon',
    firstName: 'Devon',
    gender: Gender.MALE,
    birthdate: '1990-06-24',
    city: 'Kaneohe',
    country: 'USA',
    latitude: 21.4068,
    longitude: -157.7911,
    bio: 'Climbing gym convert with a habit of turning quick sessions into half-day outings. Looking for adventure chemistry more than endless messaging.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.ADVANCED,
      weeklyFrequencyBand: '4-5',
      primaryGoal: 'skill',
      secondaryGoal: 'adventure',
      favoriteActivities: 'Climbing, Hiking, Strength Training',
      trainingStyle: 'Technique sessions plus enough strength work to keep the fingers honest.',
      prefersMorning: true,
      prefersEvening: false,
    },
    activities: ['climbing', 'hiking', 'strength-training'],
  },
  {
    slug: 'priya',
    firstName: 'Priya',
    gender: Gender.FEMALE,
    birthdate: '1995-09-14',
    city: 'Aiea',
    country: 'USA',
    latitude: 21.3866,
    longitude: -157.9231,
    bio: 'I like polished plans: strength class, smoothie, maybe a walk if the conversation is good. Competitive in a fun way, especially with step counts.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: false,
    fitness: {
      intensityLevel: IntensityLevel.INTERMEDIATE,
      weeklyFrequencyBand: '4-5',
      primaryGoal: 'strength',
      secondaryGoal: 'health',
      favoriteActivities: 'Strength Training, Boxing, Yoga',
      trainingStyle: 'Coach-led classes, a few technical sessions, and very consistent weekdays.',
      prefersMorning: false,
      prefersEvening: true,
    },
    activities: ['strength-training', 'boxing', 'yoga'],
  },
  {
    slug: 'cole',
    firstName: 'Cole',
    gender: Gender.MALE,
    birthdate: '1998-02-16',
    city: 'North Shore',
    country: 'USA',
    latitude: 21.6379,
    longitude: -158.062,
    bio: 'Surf forecast obsessive with enough discipline to still hit the gym. Mostly here for people who like ocean time and can roll with early starts.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.ADVANCED,
      weeklyFrequencyBand: '5+',
      primaryGoal: 'fun',
      secondaryGoal: 'conditioning',
      favoriteActivities: 'Surfing, Strength Training, Volleyball',
      trainingStyle: 'Surf around conditions, train around surf, repeat.',
      prefersMorning: true,
      prefersEvening: false,
    },
    activities: ['surfing', 'strength-training', 'volleyball'],
  },
  {
    slug: 'maren',
    firstName: 'Maren',
    gender: Gender.FEMALE,
    birthdate: '1992-11-08',
    city: 'Kapolei',
    country: 'USA',
    latitude: 21.335,
    longitude: -158.0566,
    bio: 'Run club, open water swim, and one adventurous plan every weekend. I like calm confidence, good playlists, and people who can pivot without spiraling.',
    intentDating: true,
    intentWorkout: true,
    intentFriends: true,
    fitness: {
      intensityLevel: IntensityLevel.ADVANCED,
      weeklyFrequencyBand: '5+',
      primaryGoal: 'endurance',
      secondaryGoal: 'health',
      favoriteActivities: 'Running, Swimming, Cycling',
      trainingStyle: 'Endurance blocks, recovery swims, and one social workout each week.',
      prefersMorning: true,
      prefersEvening: true,
    },
    activities: ['running', 'swimming', 'cycling'],
  },
];

const seedEvents: SeedEvent[] = [
  {
    slug: 'ala-moana-sunrise-run',
    title: 'Ala Moana Sunrise Run Club',
    description: 'Easy 4-mile social loop with coffee at the end. Plenty of walk breaks if the heat shows up early.',
    location: 'Magic Island, Ala Moana Beach Park',
    category: EventCategory.RUNNING,
    imageUrl: 'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
    hostSlug: 'kai',
    startDayOffset: 1,
    startHour: 6,
    durationHours: 2,
    attendeeSlugs: ['leilani', 'nia', 'eli', 'alana', 'maren'],
  },
  {
    slug: 'kakaako-rooftop-flow',
    title: 'Golden Hour Rooftop Flow',
    description: 'Vinyasa with city light views, then tea and introductions on the deck after class.',
    location: 'Salt at Our Kakaako Rooftop',
    category: EventCategory.YOGA,
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'leilani',
    startDayOffset: 1,
    startHour: 18,
    durationHours: 2,
    attendeeSlugs: ['sasha', 'alana', 'tessa', 'priya'],
  },
  {
    slug: 'diamond-head-power-hike',
    title: 'Diamond Head Power Hike',
    description: 'Fast-paced sunset hike with a scenic cooldown at Kapiolani Park after. Bring water and shoes with grip.',
    location: 'Diamond Head State Monument',
    category: EventCategory.HIKING,
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    hostSlug: 'nia',
    startDayOffset: 2,
    startHour: 17,
    durationHours: 2,
    attendeeSlugs: ['keoni', 'devon', 'maren', 'kai'],
  },
  {
    slug: 'kailua-paddle-social',
    title: 'Kailua Paddle + Breakfast',
    description: 'Beginner-friendly paddle session followed by breakfast burritos and shaded hangs on the beach.',
    location: 'Kailua Beach Park',
    category: EventCategory.PADDLING,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    hostSlug: 'malia',
    startDayOffset: 3,
    startHour: 8,
    durationHours: 3,
    attendeeSlugs: ['mason', 'leilani', 'cole', 'keoni'],
  },
  {
    slug: 'kaimuki-boxing-circuit',
    title: 'Kaimuki Boxing Circuit Night',
    description: 'Glove work, bag intervals, and a beginner lane for anyone new but curious.',
    location: 'Kaimuki Community Boxing Club',
    category: EventCategory.BOXING,
    imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80',
    hostSlug: 'jordan',
    startDayOffset: 3,
    startHour: 19,
    durationHours: 2,
    attendeeSlugs: ['rowan', 'priya', 'eli'],
  },
  {
    slug: 'waikiki-swim-laps',
    title: 'Waikiki Open Water Swim',
    description: 'Short buoy loop for steady swimmers with a safety-first pace and post-swim shave ice walk.',
    location: 'Queen’s Beach, Waikiki',
    category: EventCategory.SWIMMING,
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
    hostSlug: 'malia',
    startDayOffset: 4,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['leilani', 'keoni', 'maren', 'kai'],
  },
  {
    slug: 'downtown-strength-hour',
    title: 'Downtown Strength Hour',
    description: 'Lift-focused small group session: squat emphasis, simple accessories, zero influencer energy.',
    location: 'Honolulu Strength Lab',
    category: EventCategory.FITNESS,
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80',
    hostSlug: 'rowan',
    startDayOffset: 4,
    startHour: 18,
    durationHours: 2,
    attendeeSlugs: ['mason', 'priya', 'eli', 'cole'],
  },
  {
    slug: 'kapahulu-volleyball-social',
    title: 'Beach Volleyball Sunset Social',
    description: 'Drop-in games, rotating teams, beginner-friendly rules, and no one taking it too seriously.',
    location: 'Kapiolani Park Sand Courts',
    category: EventCategory.VOLLEYBALL,
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
    hostSlug: 'tessa',
    startDayOffset: 5,
    startHour: 17,
    durationHours: 3,
    attendeeSlugs: ['alana', 'cole', 'kai', 'sasha', 'leilani'],
  },
  {
    slug: 'makapuu-first-light',
    title: 'Makapuu First Light Hike',
    description: 'Early climb for sunrise and whale spotting if conditions cooperate. Breakfast stop after for whoever is still awake.',
    location: 'Makapuu Lighthouse Trail',
    category: EventCategory.HIKING,
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    hostSlug: 'keoni',
    startDayOffset: 6,
    startHour: 5,
    durationHours: 2,
    attendeeSlugs: ['nia', 'devon', 'maren', 'kai'],
  },
  {
    slug: 'mccully-dance-night',
    title: 'Dance Cardio + Mocktails',
    description: 'High-energy dance class with a social cooldown nearby. Perfect if you want movement without a serious vibe.',
    location: 'McCully Movement Studio',
    category: EventCategory.DANCE,
    imageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=80',
    hostSlug: 'sasha',
    startDayOffset: 6,
    startHour: 18,
    durationHours: 2,
    attendeeSlugs: ['tessa', 'alana', 'leilani', 'priya'],
  },
  {
    slug: 'pearl-city-long-ride',
    title: 'Pearl City Long Ride',
    description: 'Moderate 25-mile loop with regroup points, good road etiquette, and a cafe stop mid-ride.',
    location: 'Pearl City Shopping Center lot',
    category: EventCategory.CYCLING,
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
    hostSlug: 'eli',
    startDayOffset: 7,
    startHour: 7,
    durationHours: 3,
    attendeeSlugs: ['mason', 'rowan', 'maren'],
  },
  {
    slug: 'kakaako-pilates-brunch',
    title: 'Pilates + Brunch Plans',
    description: 'Reformer-style mat flow, then brunch for anyone who wants to actually keep hanging out.',
    location: 'Our Kakaako Courtyard',
    category: EventCategory.PILATES,
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'alana',
    startDayOffset: 7,
    startHour: 10,
    durationHours: 2,
    attendeeSlugs: ['leilani', 'tessa', 'sasha', 'priya'],
  },
  {
    slug: 'kaneohe-climb-night',
    title: 'Climb Night + Technique Laps',
    description: 'Routes and boulders, plus a mellow intro lane for anyone trying climbing for the first time.',
    location: 'Kaneohe Climbing Club',
    category: EventCategory.CLIMBING,
    imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=80',
    hostSlug: 'devon',
    startDayOffset: 8,
    startHour: 18,
    durationHours: 2,
    attendeeSlugs: ['nia', 'rowan', 'kai'],
  },
  {
    slug: 'aiea-combat-conditioning',
    title: 'Combat Conditioning Session',
    description: 'Fast circuits, mitt rounds, and good coaching if you like intensity without chaos.',
    location: 'Aiea Performance Studio',
    category: EventCategory.BOXING,
    imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80',
    hostSlug: 'priya',
    startDayOffset: 9,
    startHour: 18,
    durationHours: 2,
    attendeeSlugs: ['jordan', 'eli', 'rowan'],
  },
  {
    slug: 'north-shore-surf-morning',
    title: 'North Shore Surf Carpool',
    description: 'Carpool up, catch a few beginner-to-intermediate waves, and split poke after if the morning goes well.',
    location: 'Puaena Point, Haleiwa',
    category: EventCategory.SURFING,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    hostSlug: 'cole',
    startDayOffset: 10,
    startHour: 6,
    durationHours: 4,
    attendeeSlugs: ['kai', 'malia', 'keoni'],
  },
  {
    slug: 'kapolei-endurance-club',
    title: 'West Side Endurance Club',
    description: 'Tempo run into recovery swim. Great for people training consistently who still want a social feel.',
    location: 'Ko Olina Lagoons',
    category: EventCategory.FITNESS,
    imageUrl: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80',
    hostSlug: 'maren',
    startDayOffset: 10,
    startHour: 8,
    durationHours: 3,
    attendeeSlugs: ['eli', 'nia', 'kai', 'leilani'],
  },
  {
    slug: 'manoa-reset-walk',
    title: 'Manoa Reset Walk',
    description: 'Low-pressure recovery walk for anyone wanting movement, fresh air, and normal conversation after a long week.',
    location: 'Manoa Valley District Park',
    category: EventCategory.OTHER,
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    hostSlug: 'nia',
    startDayOffset: 11,
    startHour: 17,
    durationHours: 2,
    attendeeSlugs: ['alana', 'sasha', 'tessa', 'leilani'],
  },
  {
    slug: 'ala-moana-friends-lift',
    title: 'Friends Lift + Mobility Night',
    description: 'Partner sets, mobility finisher, and a beginner lane so new people can get comfortable fast.',
    location: 'Ala Moana Functional Fitness',
    category: EventCategory.FITNESS,
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80',
    hostSlug: 'mason',
    startDayOffset: 12,
    startHour: 18,
    durationHours: 2,
    attendeeSlugs: ['rowan', 'eli', 'priya', 'kai', 'devon'],
  },
];

function demoEmail(slug: string) {
  return `${slug}@${DEMO_EMAIL_DOMAIN}`;
}

function buildStartsAt(dayOffset: number, hour: number) {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + dayOffset);
  startsAt.setHours(hour, 0, 0, 0);
  return startsAt;
}

async function seedActivities() {
  const created = await Promise.all(
    activityCatalog.map((activity) =>
      prisma.fitnessActivity.upsert({
        where: { slug: activity.slug },
        update: { name: activity.name },
        create: activity,
      }),
    ),
  );

  return new Map(created.map((activity) => [activity.slug, activity.id]));
}

async function cleanupPreviousDemoUsers() {
  const deleted = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
        { email: { in: LEGACY_SEED_EMAILS } },
      ],
    },
  });

  return deleted.count;
}

async function main() {
  console.log('Refreshing BRDG demo seed...');

  const activityIdsBySlug = await seedActivities();
  const deletedUsers = await cleanupPreviousDemoUsers();
  console.log(`Removed ${deletedUsers} previous demo users.`);

  const createdUsers = new Map<string, { id: string; firstName: string }>();

  for (const [index, user] of seedUsers.entries()) {
    const photo = PHOTO_FILES[index % PHOTO_FILES.length];
    const created = await prisma.user.create({
      data: {
        email: demoEmail(user.slug),
        firstName: user.firstName,
        birthdate: new Date(user.birthdate),
        gender: user.gender,
        authProvider: AuthProvider.EMAIL,
        hasVerifiedEmail: true,
        isOnboarded: true,
        profile: {
          create: {
            city: user.city,
            country: user.country,
            latitude: user.latitude,
            longitude: user.longitude,
            bio: user.bio,
            intentWorkout: user.intentWorkout,
            intentDating: user.intentDating,
            intentFriends: user.intentFriends,
            showMeMen: true,
            showMeWomen: true,
            showMeOther: true,
            maxDistanceKm: 50,
          },
        },
        fitnessProfile: {
          create: {
            intensityLevel: user.fitness.intensityLevel,
            weeklyFrequencyBand: user.fitness.weeklyFrequencyBand,
            primaryGoal: user.fitness.primaryGoal,
            secondaryGoal: user.fitness.secondaryGoal ?? null,
            favoriteActivities: user.fitness.favoriteActivities,
            trainingStyle: user.fitness.trainingStyle,
            prefersMorning: user.fitness.prefersMorning ?? null,
            prefersEvening: user.fitness.prefersEvening ?? null,
          },
        },
        photos: {
          create: [
            {
              storageKey: `${BASE_URL}/pfps/${photo}`,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
      },
    });

    createdUsers.set(user.slug, {
      id: created.id,
      firstName: created.firstName,
    });

    const activityRows = user.activities
      .map((slug) => activityIdsBySlug.get(slug))
      .filter((activityId): activityId is number => typeof activityId === 'number')
      .map((activityId) => ({
        userId: created.id,
        activityId,
      }));

    if (activityRows.length) {
      await prisma.userFitnessActivity.createMany({
        data: activityRows,
        skipDuplicates: true,
      });
    }

    console.log(`Created demo profile: ${created.firstName} (${user.city})`);
  }

  let createdEventCount = 0;
  let createdRsvpCount = 0;

  for (const event of seedEvents) {
    const host = createdUsers.get(event.hostSlug);
    if (!host) continue;

    const startsAt = buildStartsAt(event.startDayOffset, event.startHour);
    const endsAt = new Date(
      startsAt.getTime() + event.durationHours * 60 * 60 * 1000,
    );

    const createdEvent = await prisma.event.create({
      data: {
        title: event.title,
        description: event.description,
        location: event.location,
        category: event.category,
        imageUrl: event.imageUrl,
        startsAt,
        endsAt,
        hostId: host.id,
      },
    });

    createdEventCount += 1;

    const attendeeIds = [
      host.id,
      ...event.attendeeSlugs
        .map((slug) => createdUsers.get(slug)?.id)
        .filter((userId): userId is string => !!userId),
    ];
    const uniqueAttendeeIds = Array.from(new Set(attendeeIds));

    if (uniqueAttendeeIds.length) {
      const result = await prisma.eventRsvp.createMany({
        data: uniqueAttendeeIds.map((userId) => ({
          eventId: createdEvent.id,
          userId,
        })),
        skipDuplicates: true,
      });
      createdRsvpCount += result.count;
    }

    console.log(
      `Created event: ${createdEvent.title} (${uniqueAttendeeIds.length} RSVPs)`,
    );
  }

  console.log(
    `Seed finished with ${createdUsers.size} demo profiles, ${createdEventCount} events, and ${createdRsvpCount} RSVPs.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
