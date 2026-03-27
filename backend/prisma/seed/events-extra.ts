import { SeedEvent, EventCategory } from './config';

export const extraOahuEvents: SeedEvent[] = [
  // ════════════════════════════════════════════════════════════════════
  // 20 ADDITIONAL OAHU EVENTS — filling calendar days 14-30
  // ════════════════════════════════════════════════════════════════════

  // ── 1. Koko Head Stairs Sunrise Challenge ─────────────────────────
  {
    slug: 'koko-head-sunrise-challenge',
    title: 'Koko Head Stairs Sunrise Challenge',
    description:
      'Tackle all 1,048 railway ties before the sun clears the ridge. We regroup at the top for photos and head down together. Bring a headlamp and plenty of water.',
    location: 'Koko Head District Park, Hawaii Kai',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    hostSlug: 'kai',
    startDayOffset: 14,
    startHour: 5,
    durationHours: 2.5,
    attendeeSlugs: ['akira', 'hana', 'keoni', 'malia', 'sora', 'koa', 'lani'],
  },

  // ── 2. Lanikai Pillbox Trail Run ──────────────────────────────────
  {
    slug: 'lanikai-pillbox-trail-run',
    title: 'Lanikai Pillbox Trail Run',
    description:
      'Fast-paced out-and-back on the Pillbox trail with panoramic Mokulua Island views. We finish with a cool-down jog through the Lanikai neighborhood streets.',
    location: 'Lanikai Pillbox Trailhead, Kailua',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
    hostSlug: 'leilani',
    startDayOffset: 15,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['mason', 'nia', 'kenji', 'mika', 'taro', 'makoa'],
  },

  // ── 3. Ala Wai Canal Paddle ───────────────────────────────────────
  {
    slug: 'ala-wai-canal-paddle-extra',
    title: 'Ala Wai Canal Paddle Session',
    description:
      'Outrigger canoe and SUP paddle along the full length of the Ala Wai Canal. Boards and canoe seats provided — just show up ready to get wet. Great for beginners.',
    location: 'Ala Wai Canal, Waikiki',
    category: EventCategory.PADDLING,
    imageUrl:
      'https://images.unsplash.com/photo-1526188717906-ab4a2f949f1a?w=1200&q=80',
    hostSlug: 'mason',
    startDayOffset: 16,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['jordan', 'alana', 'riko', 'nalani', 'marco', 'dani', 'sol'],
  },

  // ── 4. Tantalus Drive Hill Climb Ride ─────────────────────────────
  {
    slug: 'tantalus-hill-climb-ride',
    title: 'Tantalus Drive Hill Climb',
    description:
      'Grind up Round Top Drive through the rainforest canopy to the Tantalus lookout. Roughly 2,000 ft of climbing over 10 miles — bring your climbing legs and a spare tube.',
    location: 'Round Top Drive / Tantalus, Honolulu',
    category: EventCategory.CYCLING,
    imageUrl:
      'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=1200&q=80',
    hostSlug: 'nia',
    startDayOffset: 17,
    startHour: 6,
    durationHours: 3,
    attendeeSlugs: ['rowan', 'cole', 'devon', 'jax', 'blake', 'reed'],
  },

  // ── 5. Fort DeRussy Beach Yoga ────────────────────────────────────
  {
    slug: 'fort-derussy-beach-yoga',
    title: 'Fort DeRussy Beach Yoga',
    description:
      'Vinyasa flow on the sand at Fort DeRussy with the sound of waves as your soundtrack. Mats provided, but feel free to bring your own. All levels welcome.',
    location: 'Fort DeRussy Beach, Waikiki',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    hostSlug: 'jordan',
    startDayOffset: 18,
    startHour: 7,
    durationHours: 1.5,
    attendeeSlugs: ['leilani', 'malia', 'tessa', 'sasha', 'isla', 'luna', 'sage', 'wren'],
  },

  // ── 6. Kaena Point Trail Hike ─────────────────────────────────────
  {
    slug: 'kaena-point-trail-hike',
    title: 'Kaena Point Coastal Hike',
    description:
      'Remote North Shore point-to-point along the rugged Kaena coast. Watch for monk seals and albatross near the wildlife refuge. Bring sun protection — zero shade out there.',
    location: 'Kaena Point State Park, Waialua',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    hostSlug: 'malia',
    startDayOffset: 19,
    startHour: 6,
    durationHours: 4,
    attendeeSlugs: ['kai', 'keoni', 'akira', 'kekoa', 'zara', 'ash', 'koa'],
  },

  // ── 7. Queens Beach Sunset Volleyball ─────────────────────────────
  {
    slug: 'queens-beach-sunset-volleyball',
    title: 'Queens Beach Sunset Volleyball',
    description:
      'Pick-up 4v4 on the sand courts at Queens Beach as the sun drops behind Diamond Head. Rotating teams, all skill levels. We usually grab poke bowls after.',
    location: 'Queens Beach, Waikiki',
    category: EventCategory.VOLLEYBALL,
    imageUrl:
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
    hostSlug: 'rowan',
    startDayOffset: 20,
    startHour: 17,
    durationHours: 2.5,
    attendeeSlugs: ['mason', 'tessa', 'eli', 'priya', 'marco', 'dani', 'sol', 'jax'],
  },

  // ── 8. Chinatown MMA Conditioning ─────────────────────────────────
  {
    slug: 'chinatown-mma-conditioning',
    title: 'Chinatown MMA Conditioning',
    description:
      'Heavy bag rounds, pad work, and bodyweight circuits in a classic Chinatown gym. No sparring — just conditioning and technique drills. Wraps required, gloves available.',
    location: 'Chinatown, Honolulu',
    category: EventCategory.BOXING,
    imageUrl:
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80',
    hostSlug: 'tessa',
    startDayOffset: 21,
    startHour: 18,
    durationHours: 1.5,
    attendeeSlugs: ['keoni', 'cole', 'cameron', 'rafael', 'kenji', 'taro'],
  },

  // ── 9. Kapiolani Park Tempo Run ───────────────────────────────────
  {
    slug: 'kapiolani-park-tempo-run',
    title: 'Kapiolani Park Tempo Run',
    description:
      'Structured tempo workout around the Kapiolani Park loop near the bandstand. Two-mile warm-up, three miles at threshold pace, one-mile cool-down. Pacers for 7:30 and 8:30 groups.',
    location: 'Kapiolani Park Bandstand, Waikiki',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&q=80',
    hostSlug: 'sasha',
    startDayOffset: 22,
    startHour: 5,
    durationHours: 1.5,
    attendeeSlugs: ['kai', 'jordan', 'devon', 'maren', 'mika', 'makoa', 'blake'],
  },

  // ── 10. Hawaii Kai Ocean Swim ─────────────────────────────────────
  {
    slug: 'hawaii-kai-ocean-swim',
    title: 'Hawaii Kai Ocean Swim',
    description:
      'Open-water swim across Maunalua Bay with kayak support. Roughly one mile out and back along the reef line. Wetsuit optional — the water is warm year-round.',
    location: 'Maunalua Bay, Hawaii Kai',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
    hostSlug: 'eli',
    startDayOffset: 22,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['leilani', 'alana', 'noa', 'hana', 'sora', 'lani', 'nalani'],
  },

  // ── 11. Salt at Kakaako Rooftop Pilates ───────────────────────────
  {
    slug: 'kakaako-rooftop-pilates',
    title: 'Salt at Kakaako Rooftop Pilates',
    description:
      'Mat Pilates on the rooftop overlooking Kakaako with ocean views. Focus on core stability and flexibility. Mats and bands provided — just bring water and a towel.',
    location: 'Salt at Our Kakaako, Honolulu',
    category: EventCategory.PILATES,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'alana',
    startDayOffset: 23,
    startHour: 10,
    durationHours: 1.5,
    attendeeSlugs: ['malia', 'isla', 'priya', 'luna', 'sage', 'riko'],
  },

  // ── 12. UH Manoa Track Intervals ──────────────────────────────────
  {
    slug: 'uh-manoa-track-intervals',
    title: 'UH Manoa Track Intervals',
    description:
      'Classic track workout on the UH Manoa oval — 800m repeats with equal rest. Pacers available for sub-3:00 and sub-3:30 groups. Cool down on the campus paths.',
    location: 'UH Manoa Track, Honolulu',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
    hostSlug: 'devon',
    startDayOffset: 24,
    startHour: 17,
    durationHours: 1.5,
    attendeeSlugs: ['rowan', 'cole', 'cameron', 'rafael', 'kenji', 'kekoa', 'ash'],
  },

  // ── 13. Kailua Beach Bootcamp ─────────────────────────────────────
  {
    slug: 'kailua-beach-bootcamp',
    title: 'Kailua Beach Bootcamp',
    description:
      'Full-body circuit on the sand — burpees, bear crawls, sprints, and bodyweight strength. The soft sand makes everything harder. Finish with an ocean dip to cool off.',
    location: 'Kailua Beach Park, Kailua',
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    hostSlug: 'priya',
    startDayOffset: 25,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['nia', 'tessa', 'maren', 'noa', 'zara', 'wren', 'reed', 'jax'],
  },

  // ── 14. Ala Moana Channel Swim ────────────────────────────────────
  {
    slug: 'ala-moana-channel-swim',
    title: 'Ala Moana Channel Swim',
    description:
      'Guided channel crossing from Magic Island to the reef and back — about 800 meters each way. Lifeguard and kayak escort included. Perfect for building open-water confidence.',
    location: 'Ala Moana Beach Park, Honolulu',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
    hostSlug: 'cole',
    startDayOffset: 25,
    startHour: 8,
    durationHours: 2,
    attendeeSlugs: ['eli', 'alana', 'sasha', 'hana', 'makoa', 'sol'],
  },

  // ── 15. Waimanalo Beach Run ───────────────────────────────────────
  {
    slug: 'waimanalo-beach-run',
    title: 'Waimanalo Beach Run',
    description:
      'Five-mile barefoot run along Waimanalo\'s long white-sand stretch — the quietest beach on the windward side. Soft sand optional for those who want the extra burn.',
    location: 'Waimanalo Beach Park, Waimanalo',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&q=80',
    hostSlug: 'maren',
    startDayOffset: 26,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['kai', 'leilani', 'jordan', 'mika', 'taro', 'koa', 'blake'],
  },

  // ── 16. Aiea Loop Trail Hike ──────────────────────────────────────
  {
    slug: 'aiea-loop-trail-hike',
    title: 'Aiea Loop Trail Hike',
    description:
      'Shaded 4.8-mile loop through the Koolau ridge with eucalyptus groves and WWII-era plane wreckage. Moderate elevation gain, muddy in spots — trail shoes recommended.',
    location: 'Aiea Loop Trail, Keaiwa Heiau State Park',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    hostSlug: 'keoni',
    startDayOffset: 27,
    startHour: 7,
    durationHours: 3,
    attendeeSlugs: ['malia', 'rowan', 'tessa', 'akira', 'sora', 'lani', 'kekoa', 'ash'],
  },

  // ── 17. Kuliouou Ridge Sunrise ────────────────────────────────────
  {
    slug: 'kuliouou-ridge-sunrise',
    title: 'Kuliouou Ridge Sunrise Hike',
    description:
      'Pre-dawn start to catch sunrise from the Kuliouou Ridge summit. The trail is steep but short — about 2.5 miles to panoramic views of Waimanalo and the windward coast.',
    location: 'Kuliouou Ridge Trail, Honolulu',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    hostSlug: 'noa',
    startDayOffset: 28,
    startHour: 5,
    durationHours: 3.5,
    attendeeSlugs: ['nia', 'eli', 'devon', 'hana', 'kenji', 'nalani', 'marco'],
  },

  // ── 18. Ward Centre Dance Cardio ──────────────────────────────────
  {
    slug: 'ward-centre-dance-cardio',
    title: 'Ward Centre Dance Cardio',
    description:
      'High-energy dance fitness class in the open-air courtyard at Ward Centre. Afrobeats, reggaeton, and island vibes — no choreography experience needed, just bring the energy.',
    location: 'Ward Centre, Honolulu',
    category: EventCategory.DANCE,
    imageUrl:
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=80',
    hostSlug: 'isla',
    startDayOffset: 28,
    startHour: 18,
    durationHours: 1.5,
    attendeeSlugs: ['sasha', 'alana', 'priya', 'cameron', 'luna', 'zara', 'wren', 'sage'],
  },

  // ── 19. Mokapu Open Water Swim ────────────────────────────────────
  {
    slug: 'mokapu-open-water-swim',
    title: 'Mokapu Open Water Swim',
    description:
      'Mile-long open-water swim off Mokapu Peninsula with calm, clear conditions. Kayak safety escort provided. Strong swimmers only — current can pick up near the point.',
    location: 'Mokapu Peninsula, Kaneohe',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
    hostSlug: 'rafael',
    startDayOffset: 29,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['mason', 'cole', 'maren', 'taro', 'makoa', 'dani'],
  },

  // ── 20. Kahala Avenue Ride ────────────────────────────────────────
  {
    slug: 'kahala-avenue-ride',
    title: 'Kahala Avenue to Diamond Head Ride',
    description:
      'Scenic road ride from Kahala Avenue along the coast to Diamond Head and back. Mostly flat with one solid climb around the crater. Regroup at Kahala Hotel for post-ride coffee.',
    location: 'Kahala Avenue, Honolulu',
    category: EventCategory.CYCLING,
    imageUrl:
      'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=1200&q=80',
    hostSlug: 'cameron',
    startDayOffset: 30,
    startHour: 6,
    durationHours: 2.5,
    attendeeSlugs: ['nia', 'rowan', 'devon', 'jax', 'blake', 'reed', 'koa', 'sol'],
  },
];
