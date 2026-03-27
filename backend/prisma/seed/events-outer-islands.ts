import { SeedEvent, EventCategory } from './config';

export const outerIslandEvents: SeedEvent[] = [
  // ════════════════════════════════════════════════════════════════════
  // MAUI (~10 events)
  // ════════════════════════════════════════════════════════════════════

  // ── 1. Haleakala Sunrise Hike ─────────────────────────────────────
  {
    slug: 'haleakala-sunrise-hike',
    title: 'Haleakala Sunrise Summit Hike',
    description:
      'Start in the dark and summit the 10,023-foot crater rim for one of the most spectacular sunrises on earth. We\'ll hike the Sliding Sands trail down into the crater after sunrise — dress in layers, it\'s cold up top.',
    location: 'Haleakala National Park, Maui',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    hostSlug: 'koa',
    startDayOffset: 2,
    startHour: 4,
    durationHours: 4,
    attendeeSlugs: ['lani', 'makoa', 'kai', 'hoku', 'mahina', 'mason'],
  },

  // ── 2. Lahaina Waterfront Run ─────────────────────────────────────
  {
    slug: 'lahaina-waterfront-run',
    title: 'Lahaina Waterfront Run Club',
    description:
      'Casual 5K along historic Front Street with ocean views the entire way. We finish at the harbor for açaí bowls and talk story. All paces welcome.',
    location: 'Front Street, Lahaina, Maui',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
    hostSlug: 'lani',
    startDayOffset: 3,
    startHour: 6,
    durationHours: 2,
    attendeeSlugs: ['koa', 'nalani', 'akira', 'hana', 'leilani'],
  },

  // ── 3. Kihei Stand-Up Paddle ──────────────────────────────────────
  {
    slug: 'kihei-sup-session',
    title: 'Kihei Stand-Up Paddle Session',
    description:
      'Flat-water SUP at Kamaole Beach — perfect for beginners or anyone who wants a low-key paddle. Boards provided, and we usually spot turtles near the reef.',
    location: 'Kamaole Beach Park III, Kihei, Maui',
    category: EventCategory.PADDLING,
    imageUrl:
      'https://images.unsplash.com/photo-1526188717906-ab4a2f949f1a?w=1200&q=80',
    hostSlug: 'makoa',
    startDayOffset: 5,
    startHour: 8,
    durationHours: 2,
    attendeeSlugs: ['lani', 'kekoa', 'mahina', 'sora', 'kenji', 'kai'],
  },

  // ── 4. Paia Beach Yoga ────────────────────────────────────────────
  {
    slug: 'paia-beach-yoga',
    title: 'Paia Bay Sunrise Yoga',
    description:
      'Vinyasa flow on the sand at Paia Bay as the sun comes up over Haleakala. Bring your own mat — the sound of the waves is our soundtrack. Stick around for coffee at Paia Bay Coffee after.',
    location: 'Paia Bay, Maui',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    hostSlug: 'nalani',
    startDayOffset: 4,
    startHour: 6,
    durationHours: 2,
    attendeeSlugs: ['hana', 'mika', 'riko', 'aiko', 'leilani', 'mahina'],
  },

  // ── 5. Wailea Ocean Swim ──────────────────────────────────────────
  {
    slug: 'wailea-ocean-swim',
    title: 'Wailea Open Water Swim',
    description:
      'Mile-long open water swim along the Wailea coastline between Ulua and Wailea Beach. Crystal-clear visibility and calm morning conditions. Safety kayak provided.',
    location: 'Wailea Beach, Maui',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
    hostSlug: 'hoku',
    startDayOffset: 7,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['koa', 'makoa', 'akira', 'jin', 'mason'],
  },

  // ── 6. Makawao Forest Ride ────────────────────────────────────────
  {
    slug: 'makawao-forest-ride',
    title: 'Makawao Forest Mountain Bike',
    description:
      'Single-track ride through eucalyptus groves and red-dirt trails in upcountry Maui. Intermediate skill level — expect some rooty descents and a solid climb back out.',
    location: 'Makawao Forest Reserve, Maui',
    category: EventCategory.CYCLING,
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    hostSlug: 'kenji',
    startDayOffset: 6,
    startHour: 8,
    durationHours: 3,
    attendeeSlugs: ['koa', 'taro', 'hiroshi', 'makoa', 'kekoa'],
  },

  // ── 7. Ho'okipa Surf Session ──────────────────────────────────────
  {
    slug: 'hookipa-surf-session',
    title: "Ho'okipa Surf Session",
    description:
      'Intermediate-to-advanced session at one of Maui\'s premier breaks. Ho\'okipa delivers consistent swells and world-class wave faces. Watch for sea turtles hauled out on the beach.',
    location: "Ho'okipa Beach Park, Paia, Maui",
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1502680390548-bdbac40a5726?w=1200&q=80',
    hostSlug: 'kekoa',
    startDayOffset: 8,
    startHour: 7,
    durationHours: 3,
    attendeeSlugs: ['koa', 'makoa', 'sora', 'kenji', 'kai', 'mason'],
  },

  // ── 8. Upcountry Fitness Bootcamp ─────────────────────────────────
  {
    slug: 'upcountry-fitness-bootcamp',
    title: 'Upcountry Bootcamp at Pukalani',
    description:
      'High-energy outdoor bootcamp on the community field in Pukalani. Expect kettlebells, bodyweight circuits, and hill sprints with cool upcountry breezes and Haleakala views.',
    location: 'Pukalani Community Center, Maui',
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    hostSlug: 'taro',
    startDayOffset: 10,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['lani', 'nalani', 'hana', 'mika', 'hiroshi', 'aiko'],
  },

  // ── 9. Kapalua Coastal Trail ──────────────────────────────────────
  {
    slug: 'kapalua-coastal-trail',
    title: 'Kapalua Coastal Trail Hike',
    description:
      'Scenic out-and-back along the lava rock coastline between Kapalua Bay and D.T. Fleming Beach. Whale watching guaranteed in season — keep your eyes on the channel.',
    location: 'Kapalua Coastal Trail, Maui',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    hostSlug: 'hana',
    startDayOffset: 12,
    startHour: 8,
    durationHours: 3,
    attendeeSlugs: ['lani', 'mahina', 'riko', 'sakura', 'leilani', 'mei'],
  },

  // ── 10. Kihei Sunset Volleyball ───────────────────────────────────
  {
    slug: 'kihei-sunset-volleyball',
    title: 'Kalama Park Sunset Volleyball',
    description:
      'Pick-up doubles and fours on the Kalama Park sand courts as the sun drops behind the West Maui Mountains. All skill levels — we rotate teams every few games.',
    location: 'Kalama Park, Kihei, Maui',
    category: EventCategory.VOLLEYBALL,
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
    hostSlug: 'sora',
    startDayOffset: 9,
    startHour: 17,
    durationHours: 2,
    attendeeSlugs: ['makoa', 'kekoa', 'yuki', 'jin', 'mei', 'kai', 'leilani'],
  },

  // ════════════════════════════════════════════════════════════════════
  // BIG ISLAND (~6 events)
  // ════════════════════════════════════════════════════════════════════

  // ── 11. Kona Coffee Run ───────────────────────────────────────────
  {
    slug: 'kona-coffee-run',
    title: "Ali'i Drive Coffee Run",
    description:
      'Easy-paced 4-mile run along Ali\'i Drive from the Kona pier to Kahalu\'u Bay. We pass through the heart of Ironman country and finish with fresh Kona coffee at a waterfront café.',
    location: "Ali'i Drive, Kailua-Kona, Big Island",
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
    hostSlug: 'akira',
    startDayOffset: 4,
    startHour: 6,
    durationHours: 2,
    attendeeSlugs: ['hiroshi', 'mei', 'jin', 'sakura', 'mason', 'leilani'],
  },

  // ── 12. Mauna Kea Summit Hike ─────────────────────────────────────
  {
    slug: 'mauna-kea-summit-hike',
    title: 'Mauna Kea Summit Trek',
    description:
      'Full ascent from the Visitor Information Station at 9,200 feet to the 13,796-foot summit. Altitude is real — we go slow and acclimate. Sunset above the clouds is unforgettable.',
    location: 'Mauna Kea Access Road, Big Island',
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
    hostSlug: 'hiroshi',
    startDayOffset: 14,
    startHour: 10,
    durationHours: 4,
    attendeeSlugs: ['akira', 'taro', 'koa', 'kenji', 'makoa'],
  },

  // ── 13. Kohala Coast Ocean Swim ───────────────────────────────────
  {
    slug: 'kohala-coast-ocean-swim',
    title: 'Hapuna Beach Open Water Swim',
    description:
      'Half-mile ocean swim at Hapuna Beach, consistently rated one of the best beaches in the US. Calm, turquoise water and a sandy bottom make this ideal for open water beginners.',
    location: 'Hapuna Beach State Park, Kohala Coast, Big Island',
    category: EventCategory.SWIMMING,
    imageUrl:
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
    hostSlug: 'mei',
    startDayOffset: 11,
    startHour: 8,
    durationHours: 2,
    attendeeSlugs: ['akira', 'jin', 'sakura', 'hoku', 'leilani'],
  },

  // ── 14. Hilo Bay Paddle ───────────────────────────────────────────
  {
    slug: 'hilo-bay-paddle',
    title: 'Hilo Bay Morning Paddle',
    description:
      'Outrigger canoe paddle across Hilo Bay with views of Mauna Kea. We launch from Coconut Island and loop the breakwater. No experience needed — we\'ll teach you the strokes.',
    location: 'Hilo Bay, Hilo, Big Island',
    category: EventCategory.PADDLING,
    imageUrl:
      'https://images.unsplash.com/photo-1526188717906-ab4a2f949f1a?w=1200&q=80',
    hostSlug: 'jin',
    startDayOffset: 15,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['akira', 'hiroshi', 'mei', 'sakura', 'kai', 'makoa'],
  },

  // ── 15. Waimea Ranch Fitness ──────────────────────────────────────
  {
    slug: 'waimea-ranch-fitness',
    title: 'Waimea Ranch Outdoor Fitness',
    description:
      'Functional fitness in the cool Waimea highlands — think tire flips, sandbag carries, and farmer walks with a paniolo backdrop. Parker Ranch country at its finest.',
    location: 'Waimea (Kamuela), Big Island',
    category: EventCategory.FITNESS,
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    hostSlug: 'sakura',
    startDayOffset: 17,
    startHour: 8,
    durationHours: 2,
    attendeeSlugs: ['hiroshi', 'akira', 'taro', 'mika', 'yuki'],
  },

  // ── 16. Volcanoes Trail Run ───────────────────────────────────────
  {
    slug: 'volcanoes-trail-run',
    title: 'Volcanoes National Park Trail Run',
    description:
      'Run the Kilauea Iki trail through a hardened lava lake and lush rainforest. Steam vents and sulfur banks keep the scenery otherworldly. Moderate difficulty, about 4 miles round trip.',
    location: 'Hawaii Volcanoes National Park, Big Island',
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80',
    hostSlug: 'mika',
    startDayOffset: 20,
    startHour: 7,
    durationHours: 3,
    attendeeSlugs: ['akira', 'hiroshi', 'jin', 'koa', 'mason', 'leilani'],
  },

  // ════════════════════════════════════════════════════════════════════
  // KAUAI (~4 events)
  // ════════════════════════════════════════════════════════════════════

  // ── 17. Poipu Beach Yoga ──────────────────────────────────────────
  {
    slug: 'poipu-beach-yoga',
    title: 'Poipu Beach Morning Yoga',
    description:
      'Gentle hatha yoga on the grass overlooking Poipu Beach. Monk seals sometimes join us on the sand. Bring a mat and water — we flow for 75 minutes then cool off with a swim.',
    location: 'Poipu Beach Park, Kauai',
    category: EventCategory.YOGA,
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
    hostSlug: 'riko',
    startDayOffset: 6,
    startHour: 7,
    durationHours: 2,
    attendeeSlugs: ['aiko', 'yuki', 'hana', 'nalani', 'leilani', 'mahina'],
  },

  // ── 18. Kapaa Coastal Path Run ────────────────────────────────────
  {
    slug: 'kapaa-coastal-path-run',
    title: "Kapa'a Bike Path Run",
    description:
      'Flat, paved coastal path run from Kapa\'a to Kealia Beach — 4 miles out and back with unobstructed ocean views. Great for tempo work or an easy shakeout in the trade winds.',
    location: "Kapa'a Coastal Path, Kauai",
    category: EventCategory.RUNNING,
    imageUrl:
      'https://images.unsplash.com/photo-1552674605-469523170d9e?w=1200&q=80',
    hostSlug: 'aiko',
    startDayOffset: 13,
    startHour: 6,
    durationHours: 2,
    attendeeSlugs: ['riko', 'yuki', 'sora', 'kai', 'lani'],
  },

  // ── 19. Kalalau Trail Hike ────────────────────────────────────────
  {
    slug: 'kalalau-trail-hike',
    title: 'Kalalau Trail Day Hike',
    description:
      'Hike the first two miles of the legendary Kalalau Trail to Hanakapi\'ai Beach on the Na Pali Coast. Dramatic cliff-side switchbacks, waterfall views, and some of the most jaw-dropping scenery in Hawaii.',
    location: "Na Pali Coast, Ke'e Beach Trailhead, Kauai",
    category: EventCategory.HIKING,
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
    hostSlug: 'yuki',
    startDayOffset: 21,
    startHour: 7,
    durationHours: 4,
    attendeeSlugs: ['riko', 'aiko', 'koa', 'makoa', 'kekoa', 'mason'],
  },

  // ── 20. Hanalei Bay Surf ──────────────────────────────────────────
  {
    slug: 'hanalei-bay-surf',
    title: 'Hanalei Bay Surf Session',
    description:
      'Mellow longboard session in the crescent of Hanalei Bay with the Bali Hai cliffs as your backdrop. Gentle summer swells make this beginner-friendly — boards available to share.',
    location: 'Hanalei Bay, Kauai',
    category: EventCategory.SURFING,
    imageUrl:
      'https://images.unsplash.com/photo-1502680390548-bdbac40a5726?w=1200&q=80',
    hostSlug: 'mahina',
    startDayOffset: 22,
    startHour: 8,
    durationHours: 3,
    attendeeSlugs: ['yuki', 'riko', 'aiko', 'kekoa', 'kai', 'leilani', 'sora'],
  },
];
