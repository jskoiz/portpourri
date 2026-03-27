import { SeedEvent, EventCategory } from './config';

export const seedEvents: SeedEvent[] = [
  // ════════════════════════════════════════════════════════════════════
  // ORIGINAL 30 EVENTS (preserved exactly)
  // ════════════════════════════════════════════════════════════════════

  // ── 1. Running ──────────────────────────────────────────────────────
  {
    slug: 'ala-moana-sunrise-run',
    title: 'Ala Moana Sunrise Run Club',
    description:
      'Easy 4-mile social loop with coffee at the end. Plenty of walk breaks if the heat shows up early.',
    location: 'Magic Island, Ala Moana Beach Park',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
    hostSlug: 'kai',
    startDayOffset: 1,
    startHour: 6,
    durationHours: 2,
    attendeeSlugs: ['leilani', 'nia', 'eli', 'alana', 'maren'],
  },
  {
    slug: 'diamond-head-tempo-run',
    title: 'Diamond Head Tempo Loop',
    description:
      'A structured tempo session around the Diamond Head crater road. We warm up together then hit 3 miles at pace.',
    location: 'Diamond Head State Monument, Honolulu',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80',
    hostSlug: 'jordan',
    startDayOffset: 3,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['kai', 'mason', 'cole', 'devon', 'keoni'],
  },
  {
    slug: 'kapiolani-track-night',
    title: 'Kapiolani Park Track Night',
    description:
      'Interval session on the park loop — 400m repeats with full recovery jogs. All paces welcome.',
    location: 'Kapiolani Park Bandstand, Waikiki',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&q=80',
    hostSlug: 'rowan',
    startDayOffset: 5,
    startHour: 17,
    durationHours: 1.5,
    attendeeSlugs: ['jordan', 'tessa', 'sasha', 'priya', 'noa'],
  },

  // ── 2. Surfing ──────────────────────────────────────────────────────
  {
    slug: 'waikiki-longboard-session',
    title: 'Waikiki Longboard Social',
    description:
      'Mellow longboard session at Queen\'s break. Beginners encouraged — boards available to share.',
    location: 'Queen\'s Surf Beach, Waikiki',
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    hostSlug: 'keoni',
    startDayOffset: 2,
    startHour: 7,
    durationHours: 3,
    attendeeSlugs: ['kai', 'malia', 'leilani', 'cole', 'alana', 'eli'],
  },
  {
    slug: 'north-shore-dawn-patrol',
    title: 'North Shore Dawn Patrol',
    description:
      'Early morning paddle-out at Haleiwa. Intermediate+ recommended — current can be strong.',
    location: 'Haleiwa Ali\'i Beach Park, North Shore',
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1502680390548-bdbac40a5726?w=1200&q=80',
    hostSlug: 'mason',
    startDayOffset: 4,
    startHour: 5,
    durationHours: 3,
    attendeeSlugs: ['keoni', 'jordan', 'rowan', 'devon', 'cameron'],
  },

  // ── 3. Hiking ───────────────────────────────────────────────────────
  {
    slug: 'koko-head-stairs-challenge',
    title: 'Koko Head Stairs Challenge',
    description:
      '1,048 steps of pure leg burn with panoramic views at the top. We go at our own pace and regroup at the summit.',
    location: 'Koko Head District Park, Hawaii Kai',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    hostSlug: 'malia',
    startDayOffset: 2,
    startHour: 6,
    durationHours: 2,
    attendeeSlugs: ['nia', 'tessa', 'sasha', 'priya', 'maren', 'eli'],
  },
  {
    slug: 'manoa-falls-social-hike',
    title: 'Manoa Falls Social Hike',
    description:
      'Easy 1.6-mile round-trip through the rainforest. Great for conversation — the canopy keeps things cool.',
    location: 'Manoa Falls Trail, Honolulu',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    hostSlug: 'leilani',
    startDayOffset: 6,
    startHour: 8,
    durationHours: 2.5,
    attendeeSlugs: ['alana', 'malia', 'noa', 'isla', 'cameron', 'priya'],
  },
  {
    slug: 'lanikai-pillbox-sunrise',
    title: 'Lanikai Pillbox Sunrise Hike',
    description:
      'Short but steep climb to the WWII pillboxes for a front-row sunrise over the Mokulua Islands.',
    location: 'Kaiwa Ridge Trail, Lanikai',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    hostSlug: 'tessa',
    startDayOffset: 8,
    startHour: 5,
    durationHours: 2,
    attendeeSlugs: ['kai', 'leilani', 'rowan', 'sasha', 'cole'],
  },

  // ── 4. Yoga ─────────────────────────────────────────────────────────
  {
    slug: 'kaimana-beach-yoga',
    title: 'Kaimana Beach Sunrise Yoga',
    description:
      'Vinyasa flow on the sand as the sun comes up. Bring your own mat — the salt air is the only prop you need.',
    location: 'Kaimana Beach (Sans Souci), Waikiki',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'alana',
    startDayOffset: 1,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['leilani', 'malia', 'nia', 'priya', 'maren', 'isla'],
  },
  {
    slug: 'kapiolani-park-yoga',
    title: 'Kapiolani Park Community Yoga',
    description:
      'All-levels yoga under the banyan trees. We usually grab acai bowls together after.',
    location: 'Kapiolani Park, Waikiki',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    hostSlug: 'priya',
    startDayOffset: 4,
    startHour: 7,
    durationHours: 1.5,
    attendeeSlugs: ['alana', 'tessa', 'maren', 'nia', 'isla', 'june'],
  },

  // ── 5. Swimming ─────────────────────────────────────────────────────
  {
    slug: 'ala-moana-ocean-swim',
    title: 'Ala Moana Open Water Swim',
    description:
      'Half-mile out-and-back ocean swim in the calm inner reef. We swim with a buddy system — no one left behind.',
    location: 'Ala Moana Beach Park, Honolulu',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
    hostSlug: 'sasha',
    startDayOffset: 3,
    startHour: 7,
    durationHours: 1.5,
    attendeeSlugs: ['kai', 'keoni', 'mason', 'devon', 'cole'],
  },
  {
    slug: 'kailua-beach-swim-club',
    title: 'Kailua Beach Swim Club',
    description:
      'Weekly swim in the turquoise waters off Kailua Beach. We do a relaxed triangle course — about a mile total.',
    location: 'Kailua Beach Park, Kailua',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
    hostSlug: 'devon',
    startDayOffset: 7,
    startHour: 8,
    durationHours: 1.5,
    attendeeSlugs: ['sasha', 'keoni', 'eli', 'alana', 'noa', 'rafael'],
  },

  // ── 6. Boxing ───────────────────────────────────────────────────────
  {
    slug: 'chinatown-boxing-gym',
    title: 'Chinatown Boxing Basics',
    description:
      'Fundamentals class — combos, footwork, and light bag work. No experience needed, just gloves and wraps.',
    location: 'Box Jelly Gym, Chinatown, Honolulu',
    category: EventCategory.BOXING,
    imageUrl:
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80',
    hostSlug: 'cole',
    startDayOffset: 2,
    startHour: 18,
    durationHours: 1.5,
    attendeeSlugs: ['jordan', 'mason', 'rowan', 'eli', 'beck'],
  },
  {
    slug: 'downtown-kickboxing',
    title: 'Downtown Kickboxing Sparring',
    description:
      'Controlled sparring rounds for experienced strikers. Mouthguard and shin guards required.',
    location: 'Island MMA, Downtown Honolulu',
    category: EventCategory.BOXING,
    imageUrl:
      'https://images.unsplash.com/photo-1517438322307-e67111335449?w=1200&q=80',
    hostSlug: 'eli',
    startDayOffset: 9,
    startHour: 19,
    durationHours: 2,
    attendeeSlugs: ['cole', 'jordan', 'mason', 'devon', 'keoni'],
  },

  // ── 7. Fitness / CrossFit ───────────────────────────────────────────
  {
    slug: 'kaka-ako-crossfit',
    title: 'Kaka\'ako CrossFit WOD',
    description:
      'Open-gym WOD at the Kaka\'ako box. Scalable for all levels — just bring your competitive spirit.',
    location: 'CrossFit Oahu, Kaka\'ako',
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    hostSlug: 'mason',
    startDayOffset: 1,
    startHour: 17,
    durationHours: 1.5,
    attendeeSlugs: ['jordan', 'cole', 'rowan', 'devon', 'keoni', 'eli'],
  },
  {
    slug: 'ward-village-hiit',
    title: 'Ward Village HIIT Session',
    description:
      'High-intensity intervals at the outdoor park — burpees, box jumps, and kettlebells with ocean views.',
    location: 'Victoria Ward Park, Honolulu',
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80',
    hostSlug: 'nia',
    startDayOffset: 5,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['malia', 'tessa', 'sasha', 'priya', 'alana'],
  },

  // ── 8. Cycling ──────────────────────────────────────────────────────
  {
    slug: 'tantalus-hill-climb',
    title: 'Tantalus Drive Hill Climb',
    description:
      'Steady climb up Tantalus Drive with rainforest switchbacks. Regroup at the Round Top overlook.',
    location: 'Tantalus Drive, Makiki, Honolulu',
    category: EventCategory.CYCLING,
    imageUrl:
      'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=1200&q=80',
    hostSlug: 'devon',
    startDayOffset: 3,
    startHour: 6,
    durationHours: 2.5,
    attendeeSlugs: ['jordan', 'rowan', 'cole', 'cameron', 'rafael'],
  },
  {
    slug: 'north-shore-century-lite',
    title: 'North Shore Century Lite',
    description:
      'Scenic 40-mile ride from town to Haleiwa and back. Shrimp truck lunch stop included in the plan.',
    location: 'Ala Moana Blvd start → Haleiwa, North Shore',
    category: EventCategory.CYCLING,
    imageUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
    hostSlug: 'rowan',
    startDayOffset: 10,
    startHour: 6,
    durationHours: 4,
    attendeeSlugs: ['devon', 'jordan', 'mason', 'keoni', 'cameron', 'luca'],
  },

  // ── 9. Volleyball ──────────────────────────────────────────────────
  {
    slug: 'queens-beach-volleyball',
    title: 'Queen\'s Beach Pickup Volleyball',
    description:
      'Coed 4v4 pickup games on the sand courts. Rotating teams, all levels — just jump in.',
    location: 'Queen\'s Surf Beach, Waikiki',
    category: EventCategory.VOLLEYBALL,
    imageUrl:
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
    hostSlug: 'malia',
    startDayOffset: 4,
    startHour: 17,
    durationHours: 2,
    attendeeSlugs: [
      'kai', 'leilani', 'nia', 'jordan', 'keoni', 'sasha', 'eli', 'alana',
    ],
  },

  // ── 10. Climbing ────────────────────────────────────────────────────
  {
    slug: 'volcanic-rock-gym-session',
    title: 'Volcanic Rock Gym Send Session',
    description:
      'Indoor bouldering session — we project V3-V6 problems and spot each other. Shoes available to rent.',
    location: 'Volcanic Rock Gym, Kalihi',
    category: EventCategory.CLIMBING,
    imageUrl:
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=80',
    hostSlug: 'beck',
    startDayOffset: 6,
    startHour: 18,
    durationHours: 2,
    attendeeSlugs: ['rowan', 'tessa', 'cole', 'noa', 'ivy'],
  },
  {
    slug: 'mokuleia-outdoor-bouldering',
    title: 'Mokuleia Outdoor Bouldering',
    description:
      'Outdoor bouldering on the North Shore rock formations. Bring crash pads — we share beta and stoke.',
    location: 'Mokuleia Beach, North Shore',
    category: EventCategory.CLIMBING,
    imageUrl:
      'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1200&q=80',
    hostSlug: 'noa',
    startDayOffset: 12,
    startHour: 7,
    durationHours: 3,
    attendeeSlugs: ['beck', 'rowan', 'cole', 'cameron', 'ivy', 'luca'],
  },

  // ── 11. Paddling ────────────────────────────────────────────────────
  {
    slug: 'kailua-bay-paddle',
    title: 'Kailua Bay SUP & Paddle',
    description:
      'Flatwater paddle from Kailua Beach toward the Mokes. SUP or outrigger — bring what you\'ve got.',
    location: 'Kailua Beach Park, Kailua',
    category: EventCategory.PADDLING,
    imageUrl:
      'https://images.unsplash.com/photo-1526188717906-ab4a2f949f1a?w=1200&q=80',
    hostSlug: 'keoni',
    startDayOffset: 5,
    startHour: 7,
    durationHours: 2.5,
    attendeeSlugs: ['kai', 'leilani', 'malia', 'alana', 'sasha', 'devon'],
  },

  // ── 12. Pilates ─────────────────────────────────────────────────────
  {
    slug: 'kaimuki-pilates-reformer',
    title: 'Kaimuki Reformer Pilates',
    description:
      'Small-group reformer class in a cozy Kaimuki studio. Focus on core stability and posterior chain.',
    location: 'Core Power Pilates, Kaimuki',
    category: EventCategory.PILATES,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'maren',
    startDayOffset: 7,
    startHour: 10,
    durationHours: 1.5,
    attendeeSlugs: ['alana', 'priya', 'tessa', 'nia', 'isla'],
  },

  // ── 13. Dance ───────────────────────────────────────────────────────
  {
    slug: 'kaka-ako-salsa-night',
    title: 'Kaka\'ako Salsa Night',
    description:
      'Beginner-friendly salsa lesson followed by open social dancing. No partner needed — we rotate.',
    location: 'SALT at Our Kaka\'ako, Honolulu',
    category: EventCategory.DANCE,
    imageUrl:
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=80',
    hostSlug: 'luca',
    startDayOffset: 8,
    startHour: 19,
    durationHours: 2.5,
    attendeeSlugs: ['leilani', 'malia', 'nia', 'priya', 'june', 'isla', 'rafael'],
  },

  // ── 14. Other ───────────────────────────────────────────────────────
  {
    slug: 'waikiki-beach-bootcamp',
    title: 'Waikiki Beach Bootcamp',
    description:
      'Full-body bootcamp on the sand — push-ups, sprints, bear crawls, and a dip in the ocean to cool down.',
    location: 'Fort DeRussy Beach, Waikiki',
    category: EventCategory.OTHER,
    imageUrl:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
    hostSlug: 'jordan',
    startDayOffset: 6,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['kai', 'mason', 'nia', 'cole', 'rowan', 'sasha', 'eli'],
  },

  // ── Supplemental originals ──────────────────────────────────────────
  {
    slug: 'kailua-beach-run',
    title: 'Kailua Beach Path Run',
    description:
      'Flat and scenic 5K along the Kailua Beach path. Perfect for easy conversation and ocean breezes.',
    location: 'Kailua Beach Park, Kailua',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
    hostSlug: 'leilani',
    startDayOffset: 9,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['kai', 'nia', 'maren', 'noa', 'hazel'],
  },
  {
    slug: 'sunset-beach-surf',
    title: 'Sunset Beach Sunset Surf',
    description:
      'Golden hour session at Sunset Beach. Bring your shortboard — we chase the last light together.',
    location: 'Sunset Beach, North Shore',
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1502680390548-bdbac40a5726?w=1200&q=80',
    hostSlug: 'cameron',
    startDayOffset: 11,
    startHour: 17,
    durationHours: 2,
    attendeeSlugs: ['keoni', 'mason', 'kai', 'devon', 'cole'],
  },
  {
    slug: 'makapuu-lighthouse-hike',
    title: 'Makapu\'u Lighthouse Trail',
    description:
      'Paved uphill trail with whale-watching views (in season). Great workout with a stunning payoff at the top.',
    location: 'Makapu\'u Point Lighthouse Trail, Waimanalo',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    hostSlug: 'isla',
    startDayOffset: 10,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['leilani', 'malia', 'tessa', 'priya', 'june', 'arden'],
  },

  // ════════════════════════════════════════════════════════════════════
  // NEW EVENTS (35+ additional to reach 65+ total)
  // ════════════════════════════════════════════════════════════════════

  // ── Running (additional) ────────────────────────────────────────────
  {
    slug: 'waikiki-strip-5k',
    title: 'Waikiki Strip 5K Fun Run',
    description:
      'Out-and-back along Kalakaua Avenue before the tourists wake up. We finish with shave ice near the zoo.',
    location: 'Kalakaua Avenue, Waikiki',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
    hostSlug: 'noa',
    startDayOffset: 13,
    startHour: 5,
    durationHours: 1.5,
    attendeeSlugs: ['kai', 'jordan', 'rowan', 'akira', 'hana', 'koa'],
  },
  {
    slug: 'pearl-harbor-bike-path-run',
    title: 'Pearl Harbor Bike Path Run',
    description:
      'Flat 6-mile out-and-back on the paved path along Pearl Harbor. Peaceful morning miles with harbor views.',
    location: 'Pearl Harbor Bike Path, Aiea',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80',
    hostSlug: 'arden',
    startDayOffset: 15,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['mason', 'tessa', 'sasha', 'kenji', 'mika', 'lani'],
  },

  // ── Surfing (additional) ────────────────────────────────────────────
  {
    slug: 'canoes-beginner-surf',
    title: 'Canoes Beginner Surf Session',
    description:
      'Super mellow waves at Canoes break — the friendliest wave in Waikiki. Perfect for first-timers or a chill paddle.',
    location: 'Canoes Surf Break, Waikiki',
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    hostSlug: 'malia',
    startDayOffset: 14,
    startHour: 7,
    durationHours: 2.5,
    attendeeSlugs: ['alana', 'priya', 'isla', 'hana', 'sora', 'anela'],
  },
  {
    slug: 'ala-moana-bowls-session',
    title: 'Ala Moana Bowls Power Session',
    description:
      'Fast, hollow left for experienced surfers. We paddle out together and take turns on sets. Reef booties recommended.',
    location: 'Ala Moana Bowls, Honolulu',
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1502680390548-bdbac40a5726?w=1200&q=80',
    hostSlug: 'keoni',
    startDayOffset: 16,
    startHour: 6,
    durationHours: 2.5,
    attendeeSlugs: ['mason', 'cameron', 'devon', 'nalu', 'kekoa', 'makoa'],
  },

  // ── Hiking (additional) ─────────────────────────────────────────────
  {
    slug: 'kuliouou-ridge-hike',
    title: 'Kuliouou Ridge Trail Hike',
    description:
      'Challenging 5-mile round-trip ridge hike with panoramic views of the windward coast. Bring plenty of water.',
    location: 'Kuliouou Ridge Trail, Hawaii Kai',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    hostSlug: 'hazel',
    startDayOffset: 13,
    startHour: 6,
    durationHours: 3.5,
    attendeeSlugs: ['tessa', 'rowan', 'noa', 'sora', 'yuki', 'keala'],
  },
  {
    slug: 'aiea-loop-trail',
    title: 'Aiea Loop Trail Group Hike',
    description:
      'Moderate 4.8-mile loop through eucalyptus and Norfolk pines. Shaded most of the way with great ridge views.',
    location: 'Aiea Loop Trail, Keaiwa Heiau State Park',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    hostSlug: 'rafael',
    startDayOffset: 17,
    startHour: 7,
    durationHours: 3,
    attendeeSlugs: ['leilani', 'malia', 'isla', 'taro', 'riko', 'mahina'],
  },
  {
    slug: 'diamond-head-sunrise-hike',
    title: 'Diamond Head Sunrise Hike',
    description:
      'Classic Oahu hike timed for sunrise. We meet at the tunnel entrance and summit together for golden hour photos.',
    location: 'Diamond Head State Monument, Honolulu',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    hostSlug: 'june',
    startDayOffset: 20,
    startHour: 5,
    durationHours: 2,
    attendeeSlugs: ['priya', 'maren', 'alana', 'aiko', 'hiroshi', 'mei'],
  },

  // ── Yoga (additional) ──────────────────────────────────────────────
  {
    slug: 'ala-moana-beach-yoga',
    title: 'Ala Moana Beach Flow',
    description:
      'Sunrise vinyasa on the sand at Magic Island. The sound of waves is our soundtrack. Mats and good vibes only.',
    location: 'Magic Island, Ala Moana Beach Park',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    hostSlug: 'ivy',
    startDayOffset: 12,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['alana', 'priya', 'leilani', 'sakura', 'anela', 'pua'],
  },
  {
    slug: 'north-shore-sunset-yoga',
    title: 'North Shore Sunset Yoga',
    description:
      'Yin-style sunset session on the grass at Haleiwa Beach Park. Slow stretches, deep breaths, and golden light.',
    location: 'Haleiwa Beach Park, North Shore',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'june',
    startDayOffset: 18,
    startHour: 17,
    durationHours: 1.5,
    attendeeSlugs: ['malia', 'tessa', 'isla', 'hana', 'yuna', 'emi', 'luna'],
  },
  {
    slug: 'ko-olina-resort-yoga',
    title: 'Ko Olina Lagoon Morning Yoga',
    description:
      'Gentle hatha flow by the calm lagoon waters. Beginners welcome — we focus on breath and balance.',
    location: 'Ko Olina Lagoon 2, Kapolei',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    hostSlug: 'priya',
    startDayOffset: 22,
    startHour: 7,
    durationHours: 1.5,
    attendeeSlugs: ['alana', 'maren', 'isla', 'nina', 'zara', 'pearl'],
  },

  // ── Swimming (additional) ──────────────────────────────────────────
  {
    slug: 'hanauma-bay-swim',
    title: 'Hanauma Bay Snorkel Swim',
    description:
      'Swim and snorkel in the protected bay. We do a lap around the inner reef then free-explore. Fins recommended.',
    location: 'Hanauma Bay Nature Preserve, Hawaii Kai',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
    hostSlug: 'alana',
    startDayOffset: 14,
    startHour: 8,
    durationHours: 2.5,
    attendeeSlugs: ['sasha', 'leilani', 'malia', 'jin', 'mei', 'tia'],
  },
  {
    slug: 'ko-olina-lagoon-swim',
    title: 'Ko Olina Lagoon Distance Swim',
    description:
      'Calm, protected lagoon perfect for distance training. We swim laps between the rock barriers — about 1500m total.',
    location: 'Ko Olina Lagoon 3, Kapolei',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80',
    hostSlug: 'devon',
    startDayOffset: 19,
    startHour: 7,
    durationHours: 1.5,
    attendeeSlugs: ['sasha', 'keoni', 'eli', 'rafa', 'marco', 'nalu'],
  },

  // ── Boxing (additional) ─────────────────────────────────────────────
  {
    slug: 'kalihi-muay-thai',
    title: 'Kalihi Muay Thai Drills',
    description:
      'Thai pad rounds, clinch work, and conditioning. All levels welcome but bring your own gloves and wraps.',
    location: 'Sitan Gym Hawaii, Kalihi',
    category: EventCategory.BOXING,
    imageUrl:
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200&q=80',
    hostSlug: 'jordan',
    startDayOffset: 15,
    startHour: 18,
    durationHours: 1.5,
    attendeeSlugs: ['cole', 'eli', 'mason', 'kenji', 'taro', 'ikaika'],
  },
  {
    slug: 'mililani-community-boxing',
    title: 'Mililani Community Center Boxing',
    description:
      'Cardio boxing class in the community gym. Heavy bag circuits, jump rope, and core finishers. Great stress relief.',
    location: 'Mililani Community Center, Mililani',
    category: EventCategory.BOXING,
    imageUrl:
      'https://images.unsplash.com/photo-1517438322307-e67111335449?w=1200&q=80',
    hostSlug: 'beck',
    startDayOffset: 21,
    startHour: 17,
    durationHours: 1.5,
    attendeeSlugs: ['rowan', 'devon', 'sasha', 'jax', 'zeke', 'blake'],
  },

  // ── Fitness (additional) ────────────────────────────────────────────
  {
    slug: 'hawaii-kai-outdoor-gym',
    title: 'Hawaii Kai Outdoor Strength',
    description:
      'Bodyweight and kettlebell workout at the outdoor fitness stations. We program push-pull-legs and finish with carries.',
    location: 'Hawaii Kai Park, Hawaii Kai',
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    hostSlug: 'cole',
    startDayOffset: 14,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['mason', 'jordan', 'rowan', 'makoa', 'kekoa', 'ikaika'],
  },
  {
    slug: 'kapiolani-park-bootcamp',
    title: 'Kapiolani Park Sunrise Bootcamp',
    description:
      'Partner-based bootcamp under the trees. Expect sandbag carries, sprints, and plenty of high-fives.',
    location: 'Kapiolani Park, Waikiki',
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80',
    hostSlug: 'nia',
    startDayOffset: 16,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['tessa', 'sasha', 'malia', 'hoku', 'kalani', 'sky'],
  },
  {
    slug: 'moiliili-strength-club',
    title: 'Moiliili Barbell Club',
    description:
      'Open barbell session focusing on the big three — squat, bench, deadlift. We share racks and spot each other.',
    location: 'Iron Works Gym, Moiliili',
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    hostSlug: 'mason',
    startDayOffset: 20,
    startHour: 17,
    durationHours: 2,
    attendeeSlugs: ['cole', 'jordan', 'eli', 'jax', 'zeke', 'tate', 'beau'],
  },

  // ── Cycling (additional) ────────────────────────────────────────────
  {
    slug: 'kaena-point-ride',
    title: 'Kaena Point Coastal Ride',
    description:
      'Ride out to the westernmost tip of Oahu along the rugged coast road. Moderate pace with photo stops.',
    location: 'Kaena Point State Park, Waianae',
    category: EventCategory.CYCLING,
    imageUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
    hostSlug: 'cameron',
    startDayOffset: 18,
    startHour: 6,
    durationHours: 3.5,
    attendeeSlugs: ['devon', 'rowan', 'jordan', 'luca', 'rio', 'dale'],
  },
  {
    slug: 'pearl-harbor-bike-loop',
    title: 'Pearl Harbor Bike Path Loop',
    description:
      'Relaxed 15-mile loop on the paved multi-use path. Flat terrain, perfect for social riding and catching up.',
    location: 'Pearl Harbor Bike Path, Aiea',
    category: EventCategory.CYCLING,
    imageUrl:
      'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=1200&q=80',
    hostSlug: 'luca',
    startDayOffset: 23,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['devon', 'cameron', 'rafael', 'sol', 'reed', 'wren'],
  },

  // ── Volleyball (additional) ─────────────────────────────────────────
  {
    slug: 'kailua-beach-volleyball',
    title: 'Kailua Beach Volleyball Jam',
    description:
      'Bring-your-own-ball pickup games on Kailua\'s wide sand. We set up nets early and play until sunset.',
    location: 'Kailua Beach Park, Kailua',
    category: EventCategory.VOLLEYBALL,
    imageUrl:
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
    hostSlug: 'sasha',
    startDayOffset: 11,
    startHour: 16,
    durationHours: 2.5,
    attendeeSlugs: ['kai', 'malia', 'keoni', 'leilani', 'koa', 'lani', 'anela', 'nalu'],
  },
  {
    slug: 'ala-moana-volleyball',
    title: 'Ala Moana Courts Volleyball',
    description:
      'Competitive 6v6 on the park courts. We draft teams on arrival — intermediate+ players preferred.',
    location: 'Ala Moana Beach Park Courts, Honolulu',
    category: EventCategory.VOLLEYBALL,
    imageUrl:
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
    hostSlug: 'keoni',
    startDayOffset: 19,
    startHour: 17,
    durationHours: 2,
    attendeeSlugs: ['jordan', 'mason', 'nia', 'cole', 'eli', 'makoa', 'ikaika', 'kekoa'],
  },

  // ── Climbing (additional) ──────────────────────────────────────────
  {
    slug: 'hi-climb-top-rope',
    title: 'HiClimb Top Rope Night',
    description:
      'Top rope climbing night at HiClimb. We belay each other and work on technique. Harness rental available.',
    location: 'HiClimb Indoor Climbing, Kakaako',
    category: EventCategory.CLIMBING,
    imageUrl:
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=80',
    hostSlug: 'ivy',
    startDayOffset: 16,
    startHour: 18,
    durationHours: 2,
    attendeeSlugs: ['beck', 'noa', 'tessa', 'rowan', 'ash', 'sky'],
  },

  // ── Paddling (additional) ──────────────────────────────────────────
  {
    slug: 'ala-wai-canal-paddle',
    title: 'Ala Wai Canal OC-6 Practice',
    description:
      'Outrigger canoe practice on the Ala Wai. Six-person crews — we rotate seats. No experience necessary.',
    location: 'Ala Wai Canal, Waikiki',
    category: EventCategory.PADDLING,
    imageUrl:
      'https://images.unsplash.com/photo-1526188717906-ab4a2f949f1a?w=1200&q=80',
    hostSlug: 'kai',
    startDayOffset: 15,
    startHour: 17,
    durationHours: 2,
    attendeeSlugs: ['keoni', 'malia', 'leilani', 'mason', 'koa', 'nalu', 'makoa'],
  },
  {
    slug: 'maunalua-bay-sup',
    title: 'Maunalua Bay SUP Tour',
    description:
      'Leisurely stand-up paddleboard tour along the bay. Crystal clear water, easy conditions, and a social vibe.',
    location: 'Maunalua Bay, Hawaii Kai',
    category: EventCategory.PADDLING,
    imageUrl:
      'https://images.unsplash.com/photo-1526188717906-ab4a2f949f1a?w=1200&q=80',
    hostSlug: 'alana',
    startDayOffset: 21,
    startHour: 8,
    durationHours: 2,
    attendeeSlugs: ['leilani', 'priya', 'isla', 'hana', 'sakura', 'pua'],
  },
  {
    slug: 'keehi-lagoon-paddle',
    title: 'Keehi Lagoon Flatwater Paddle',
    description:
      'Protected flatwater session at Keehi Lagoon. Great for building endurance on the SUP or OC-1.',
    location: 'Keehi Lagoon Beach Park, Honolulu',
    category: EventCategory.PADDLING,
    imageUrl:
      'https://images.unsplash.com/photo-1526188717906-ab4a2f949f1a?w=1200&q=80',
    hostSlug: 'keoni',
    startDayOffset: 25,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['kai', 'devon', 'sasha', 'kekoa', 'nalu', 'lani'],
  },

  // ── Pilates (additional) ────────────────────────────────────────────
  {
    slug: 'manoa-mat-pilates',
    title: 'Manoa Valley Mat Pilates',
    description:
      'Mat-based Pilates in a cool Manoa studio. Focus on alignment, breathing, and deep core activation.',
    location: 'Manoa Valley Studio, Manoa',
    category: EventCategory.PILATES,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'maren',
    startDayOffset: 17,
    startHour: 10,
    durationHours: 1.5,
    attendeeSlugs: ['alana', 'priya', 'tessa', 'nia', 'fern', 'vera'],
  },
  {
    slug: 'kakaako-tower-pilates',
    title: 'Kakaako Tower Pilates',
    description:
      'Reformer and tower combo class in a sleek Kakaako studio. Small group, lots of individual attention.',
    location: 'Align Pilates Studio, Kakaako',
    category: EventCategory.PILATES,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'isla',
    startDayOffset: 24,
    startHour: 9,
    durationHours: 1.5,
    attendeeSlugs: ['maren', 'priya', 'alana', 'june', 'pearl', 'cora'],
  },

  // ── Dance (additional) ──────────────────────────────────────────────
  {
    slug: 'waikiki-hula-class',
    title: 'Waikiki Beach Hula Class',
    description:
      'Traditional hula basics on the beach. Learn the stories behind each movement while the sun sets.',
    location: 'Kuhio Beach, Waikiki',
    category: EventCategory.DANCE,
    imageUrl:
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=80',
    hostSlug: 'leilani',
    startDayOffset: 19,
    startHour: 17,
    durationHours: 1.5,
    attendeeSlugs: ['malia', 'alana', 'priya', 'anela', 'hoku', 'mahina', 'pua'],
  },
  {
    slug: 'chinatown-dance-fitness',
    title: 'Chinatown Dance Fitness',
    description:
      'High-energy dance cardio — hip-hop, reggaeton, and pop choreography. No dance experience needed, just energy.',
    location: 'Arts at Marks Garage, Chinatown',
    category: EventCategory.DANCE,
    imageUrl:
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=80',
    hostSlug: 'nia',
    startDayOffset: 24,
    startHour: 18,
    durationHours: 1.5,
    attendeeSlugs: ['leilani', 'malia', 'tessa', 'luna', 'nova', 'kira', 'bree'],
  },

  // ── Other (additional) ─────────────────────────────────────────────
  {
    slug: 'ala-moana-park-tai-chi',
    title: 'Ala Moana Park Tai Chi',
    description:
      'Slow-flow tai chi practice on the grass near the pond. Great for recovery days and mental clarity.',
    location: 'Ala Moana Beach Park, Honolulu',
    category: EventCategory.OTHER,
    imageUrl:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
    hostSlug: 'priya',
    startDayOffset: 22,
    startHour: 7,
    durationHours: 1.5,
    attendeeSlugs: ['alana', 'maren', 'june', 'sage', 'fern', 'opal'],
  },
  {
    slug: 'fort-derussy-obstacle-run',
    title: 'Fort DeRussy Obstacle Course',
    description:
      'DIY obstacle course on the beach — rope climbs, sand sprints, and partner carries. Competitive but fun.',
    location: 'Fort DeRussy Beach, Waikiki',
    category: EventCategory.OTHER,
    imageUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80',
    hostSlug: 'eli',
    startDayOffset: 26,
    startHour: 6,
    durationHours: 2,
    attendeeSlugs: ['jordan', 'cole', 'mason', 'rowan', 'jax', 'zeke', 'tate'],
  },

  // ── Outer Islands ──────────────────────────────────────────────────

  // Maui
  {
    slug: 'maui-haleakala-sunrise-hike',
    title: 'Haleakala Sunrise Hike',
    description:
      'Summit-to-crater sunrise hike on Maui\'s highest peak. We meet at the visitor center at 4:30 AM. Dress warm — it\'s cold up top.',
    location: 'Haleakala National Park, Maui',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    hostSlug: 'tessa',
    startDayOffset: 23,
    startHour: 5,
    durationHours: 4,
    attendeeSlugs: ['rowan', 'noa', 'hazel', 'sora', 'yuki', 'keala', 'hoku'],
  },
  {
    slug: 'maui-hookipa-surf',
    title: 'Ho\'okipa Beach Surf Session',
    description:
      'World-class waves on Maui\'s north shore. Intermediate to advanced — the reef is shallow and the current is real.',
    location: 'Ho\'okipa Beach Park, Paia, Maui',
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1502680390548-bdbac40a5726?w=1200&q=80',
    hostSlug: 'cameron',
    startDayOffset: 25,
    startHour: 6,
    durationHours: 3,
    attendeeSlugs: ['keoni', 'mason', 'devon', 'nalu', 'koa', 'makoa'],
  },
  {
    slug: 'maui-wailea-beach-yoga',
    title: 'Wailea Beach Morning Yoga',
    description:
      'Beachfront yoga at one of Maui\'s most beautiful resort beaches. Open to all levels with ocean breeze relaxation.',
    location: 'Wailea Beach, Maui',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    hostSlug: 'june',
    startDayOffset: 27,
    startHour: 7,
    durationHours: 1.5,
    attendeeSlugs: ['alana', 'priya', 'isla', 'yuna', 'emi', 'sakura'],
  },
  {
    slug: 'maui-lahaina-run',
    title: 'Lahaina Waterfront Run',
    description:
      'Flat 5K along the historic Lahaina waterfront. We run past the banyan tree and along Front Street. Easy pace.',
    location: 'Lahaina Waterfront, Maui',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&q=80',
    hostSlug: 'noa',
    startDayOffset: 28,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['kai', 'leilani', 'maren', 'hana', 'lani', 'anela'],
  },

  // Big Island
  {
    slug: 'big-island-volcanoes-hike',
    title: 'Volcanoes National Park Hike',
    description:
      'Kilauea Iki trail — hike across a solidified lava lake through steam vents and lush rainforest. Unforgettable terrain.',
    location: 'Kilauea Iki Trail, Volcanoes National Park, Big Island',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    hostSlug: 'rafael',
    startDayOffset: 24,
    startHour: 7,
    durationHours: 4,
    attendeeSlugs: ['tessa', 'hazel', 'rowan', 'noa', 'taro', 'riko', 'hiroshi'],
  },
  {
    slug: 'big-island-kona-swim',
    title: 'Kona Ironman Swim Course',
    description:
      'Swim the famous Ironman World Championship course in Kailua Bay. 1.2 miles in the calm Kona waters.',
    location: 'Kailua Bay, Kailua-Kona, Big Island',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
    hostSlug: 'sasha',
    startDayOffset: 26,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['devon', 'keoni', 'eli', 'marco', 'rafa', 'sol'],
  },
  {
    slug: 'big-island-kona-cycling',
    title: 'Kona Coast Queen K Ride',
    description:
      'Ride the legendary Queen Kaahumanu Highway — the Ironman bike course. Hot, windy, and absolutely epic.',
    location: 'Queen Kaahumanu Highway, Kona, Big Island',
    category: EventCategory.CYCLING,
    imageUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80',
    hostSlug: 'devon',
    startDayOffset: 27,
    startHour: 6,
    durationHours: 3.5,
    attendeeSlugs: ['rowan', 'cameron', 'jordan', 'luca', 'dale', 'reed'],
  },

  // Kauai
  {
    slug: 'kauai-napali-coast-hike',
    title: 'Kalalau Trail Day Hike',
    description:
      'First 2 miles of the Kalalau Trail to Hanakapi\'ai Beach. Jaw-dropping Na Pali Coast views the entire way.',
    location: 'Kalalau Trail, Ha\'ena State Park, Kauai',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    hostSlug: 'hazel',
    startDayOffset: 29,
    startHour: 7,
    durationHours: 4,
    attendeeSlugs: ['tessa', 'rafael', 'noa', 'isla', 'sora', 'keala', 'yuki'],
  },
  {
    slug: 'kauai-poipu-surf',
    title: 'Poipu Beach Surf & Chill',
    description:
      'Friendly south shore waves perfect for all levels. We surf for a couple hours then grab poke nearby.',
    location: 'Poipu Beach Park, Kauai',
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    hostSlug: 'keoni',
    startDayOffset: 30,
    startHour: 8,
    durationHours: 2.5,
    attendeeSlugs: ['kai', 'mason', 'cameron', 'koa', 'nalu', 'makoa'],
  },
  {
    slug: 'kauai-hanalei-bay-paddle',
    title: 'Hanalei Bay SUP Session',
    description:
      'Stand-up paddle in the crescent-shaped Hanalei Bay with mountain backdrop. Flat water, pure paradise.',
    location: 'Hanalei Bay, Kauai',
    category: EventCategory.PADDLING,
    imageUrl:
      'https://images.unsplash.com/photo-1526188717906-ab4a2f949f1a?w=1200&q=80',
    hostSlug: 'malia',
    startDayOffset: 30,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['leilani', 'alana', 'isla', 'anela', 'pua', 'hoku'],
  },

  // ── More Oahu events to fill categories ────────────────────────────
  {
    slug: 'pipeline-spectator-surf',
    title: 'Pipeline Watch & Surf',
    description:
      'Experienced surfers only — we paddle out at Pipe when it\'s in the 4-6 foot range. Safety in numbers out there.',
    location: 'Banzai Pipeline, North Shore',
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1502680390548-bdbac40a5726?w=1200&q=80',
    hostSlug: 'mason',
    startDayOffset: 22,
    startHour: 6,
    durationHours: 3,
    attendeeSlugs: ['keoni', 'cameron', 'devon', 'cole', 'kekoa', 'nalu'],
  },
  {
    slug: 'salt-lake-community-fitness',
    title: 'Salt Lake Park Group Fitness',
    description:
      'Community-driven outdoor fitness session — circuits, resistance bands, and bodyweight moves. Welcoming to all.',
    location: 'Salt Lake District Park, Honolulu',
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&q=80',
    hostSlug: 'nia',
    startDayOffset: 25,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['malia', 'tessa', 'sasha', 'quinn', 'nova', 'bree', 'shay'],
  },
  {
    slug: 'wahiawa-trail-run',
    title: 'Wahiawa Hills Trail Run',
    description:
      'Red dirt trails through the central Oahu highlands. About 5 miles of rolling hills with eucalyptus shade.',
    location: 'Wahiawa Hills, Wahiawa',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80',
    hostSlug: 'rowan',
    startDayOffset: 26,
    startHour: 6,
    durationHours: 2,
    attendeeSlugs: ['jordan', 'devon', 'noa', 'akira', 'kenji', 'taro'],
  },
  {
    slug: 'waimanalo-beach-volleyball',
    title: 'Waimanalo Beach Volleyball',
    description:
      'Chill pickup games on the longest sandy beach on Oahu. Doubles or triples — we play until the sun gets low.',
    location: 'Waimanalo Beach Park, Waimanalo',
    category: EventCategory.VOLLEYBALL,
    imageUrl:
      'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=1200&q=80',
    hostSlug: 'kai',
    startDayOffset: 28,
    startHour: 16,
    durationHours: 2.5,
    attendeeSlugs: ['malia', 'keoni', 'sasha', 'lani', 'koa', 'anela', 'nalu', 'makoa'],
  },
  {
    slug: 'downtown-yoga-studio',
    title: 'Downtown Power Yoga',
    description:
      'Heated power yoga in a downtown studio. 75 minutes of challenging flows — great for building strength and flexibility.',
    location: 'Yoga Hawaii, Downtown Honolulu',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'alana',
    startDayOffset: 28,
    startHour: 12,
    durationHours: 1.5,
    attendeeSlugs: ['priya', 'maren', 'tessa', 'sakura', 'yuna', 'luna'],
  },
  {
    slug: 'ewa-beach-swim',
    title: 'Ewa Beach Morning Swim',
    description:
      'Calm waters and wide sandy beach — perfect for a no-fuss ocean swim. We do 800m loops parallel to shore.',
    location: 'Ewa Beach Park, Ewa Beach',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
    hostSlug: 'sasha',
    startDayOffset: 29,
    startHour: 7,
    durationHours: 1.5,
    attendeeSlugs: ['devon', 'eli', 'keoni', 'rafa', 'marco', 'dani'],
  },
  {
    slug: 'kakaako-bouldering-comp',
    title: 'Kakaako Bouldering Mini Comp',
    description:
      'Friendly bouldering competition — 10 problems, 2 hours to flash them all. Prizes are just bragging rights.',
    location: 'HiClimb Indoor Climbing, Kakaako',
    category: EventCategory.CLIMBING,
    imageUrl:
      'https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1200&q=80',
    hostSlug: 'beck',
    startDayOffset: 27,
    startHour: 13,
    durationHours: 2.5,
    attendeeSlugs: ['noa', 'ivy', 'rowan', 'tessa', 'cole', 'ash', 'sky', 'kit'],
  },
  {
    slug: 'kailua-sunrise-pilates',
    title: 'Kailua Sunrise Mat Pilates',
    description:
      'Early morning mat Pilates at the beach park pavilion. Core-focused with stretch breaks and ocean views.',
    location: 'Kailua Beach Park Pavilion, Kailua',
    category: EventCategory.PILATES,
    imageUrl:
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
    hostSlug: 'maren',
    startDayOffset: 29,
    startHour: 6,
    durationHours: 1.5,
    attendeeSlugs: ['alana', 'priya', 'isla', 'june', 'nell', 'lark'],
  },
  {
    slug: 'kakaako-waterfront-stretch',
    title: 'Kakaako Waterfront Stretch & Mobility',
    description:
      'Guided mobility and stretching session on the waterfront lawn. Foam rollers and lacrosse balls provided. Great for recovery.',
    location: 'Kakaako Waterfront Park, Honolulu',
    category: EventCategory.OTHER,
    imageUrl:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80',
    hostSlug: 'maren',
    startDayOffset: 23,
    startHour: 8,
    durationHours: 1.5,
    attendeeSlugs: ['alana', 'priya', 'tessa', 'sage', 'wren', 'fern'],
  },
  {
    slug: 'ward-warehouse-dance-cardio',
    title: 'Ward Dance Cardio Pop-Up',
    description:
      'High-energy outdoor dance cardio at the Ward Warehouse plaza. Mix of Afrobeats, K-pop, and Latin rhythms.',
    location: 'Ward Centre, Honolulu',
    category: EventCategory.DANCE,
    imageUrl:
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=80',
    hostSlug: 'luca',
    startDayOffset: 29,
    startHour: 18,
    durationHours: 1.5,
    attendeeSlugs: ['leilani', 'malia', 'nia', 'isla', 'luna', 'nova', 'kira', 'bree'],
  },
];
