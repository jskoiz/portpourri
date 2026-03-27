import { Gender } from './config';

/**
 * Photo URL assignments for BRDG seed users.
 *
 * Organises real Unsplash photos into themed pools (portraits, activities,
 * lifestyle) and exposes a deterministic picker so every seed user gets a
 * consistent, realistic set of profile photos.
 */

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

const portrait = (id: string) =>
  `https://images.unsplash.com/${id}?w=600&h=800&fit=crop&crop=faces`;

const activity = (id: string) =>
  `https://images.unsplash.com/${id}?w=600&h=800&fit=crop`;

// ---------------------------------------------------------------------------
// Photo pools
// ---------------------------------------------------------------------------

/**
 * Portrait pools reviewed manually from the current Unsplash set.
 *
 * We intentionally exclude several mixed or low-confidence entries from the
 * old shared portrait array so seeded users do not lead with obviously
 * mismatched or non-person photos.
 */
const FEMALE_PORTRAIT_PHOTOS: string[] = [
  portrait('photo-1494790108377-be9c29b29330'),
  portrait('photo-1438761681033-6461ffad8d80'),
  portrait('photo-1524504388940-b1c1722653e1'),
  portrait('photo-1517841905240-472988babdf9'),
  portrait('photo-1488426862026-3ee34a7d66df'),
  portrait('photo-1502823403499-6ccfcf4fb453'),
  portrait('photo-1529626455594-4ff0802cfb7e'),
  portrait('photo-1544005313-94ddf0286df2'),
  portrait('photo-1524638431109-93d95c968f03'),
  portrait('photo-1517365830460-955ce3ccd263'),
  portrait('photo-1501196354995-cbb51c65aaea'),
  portrait('photo-1504199367641-aba8151af406'),
  portrait('photo-1504703395950-b89145a5425b'),
  portrait('photo-1546961342-ea5f71b193f3'),
  portrait('photo-1542206395-9feb3edaa68d'),
];

const MALE_PORTRAIT_PHOTOS: string[] = [
  portrait('photo-1507003211169-0a1dd7228f2d'),
  portrait('photo-1506794778202-cad84cf45f1d'),
  portrait('photo-1531746020798-e6953c6e8e04'),
  portrait('photo-1568602471122-7832951cc4c5'),
  portrait('photo-1539571696357-5a69c17a67c6'),
  portrait('photo-1500648767791-00dcc994a43e'),
  portrait('photo-1521119989659-a83eee488004'),
  portrait('photo-1519345182560-3f2917c472ef'),
  portrait('photo-1504257432389-52343af06ae3'),
  portrait('photo-1463453091185-61582044d556'),
  portrait('photo-1522556189639-b150ed9c4330'),
  portrait('photo-1495474472287-4d71bcdd2085'),
  portrait('photo-1519058082700-08a0b56da9b2'),
  portrait('photo-1528892952291-009c663ce843'),
  portrait('photo-1472099645785-5658abf4ff4e'),
  portrait('photo-1507591064344-4c6ce005b128'),
  portrait('photo-1530268729831-4b0b9e170218'),
  portrait('photo-1496345875659-11f7dd282d1d'),
];

const NON_BINARY_PORTRAIT_PHOTOS: string[] = [
  portrait('photo-1494790108377-be9c29b29330'),
  portrait('photo-1507003211169-0a1dd7228f2d'),
  portrait('photo-1438761681033-6461ffad8d80'),
  portrait('photo-1531746020798-e6953c6e8e04'),
  portrait('photo-1524504388940-b1c1722653e1'),
  portrait('photo-1517841905240-472988babdf9'),
  portrait('photo-1534528741775-53994a69daeb'),
  portrait('photo-1539571696357-5a69c17a67c6'),
  portrait('photo-1488426862026-3ee34a7d66df'),
  portrait('photo-1529626455594-4ff0802cfb7e'),
  portrait('photo-1519345182560-3f2917c472ef'),
  portrait('photo-1463453091185-61582044d556'),
  portrait('photo-1501196354995-cbb51c65aaea'),
  portrait('photo-1472099645785-5658abf4ff4e'),
  portrait('photo-1504703395950-b89145a5425b'),
];

const ALL_REVIEWED_PORTRAIT_PHOTOS: string[] = Array.from(
  new Set([
    ...FEMALE_PORTRAIT_PHOTOS,
    ...MALE_PORTRAIT_PHOTOS,
    ...NON_BINARY_PORTRAIT_PHOTOS,
  ]),
);

/** ~15 running / jogging photos */
const RUNNING_PHOTOS: string[] = [
  activity('photo-1552674605-469523170d9e'),
  activity('photo-1483721310020-03333e577078'),
  activity('photo-1571008887538-b36bb32f4571'),
  activity('photo-1517649763962-0c623066013b'),
  activity('photo-1461896836934-bd45ba688bdb'),
  activity('photo-1476480862126-209bfaa8edc8'),
  activity('photo-1486218119243-13883505764c'),
  activity('photo-1587280501635-68a0e82cd5ff'),
  activity('photo-1540525080842-14562ad26cd1'),
  activity('photo-1529795533870-ea8020213f08'),
  activity('photo-1594882645126-14020914d58d'),
  activity('photo-1551698618-1dfe5d97d256'),
  activity('photo-1559763593-6ebf932cd29a'),
  activity('photo-1541252260730-0412e8e2108e'),
  activity('photo-1596727362302-b8d891c42ab8'),
];

/** ~15 ocean / surfing / beach sports photos */
const SURFING_PHOTOS: string[] = [
  activity('photo-1507525428034-b723cf961d3e'),
  activity('photo-1502680390548-bdbac40a5726'),
  activity('photo-1518459031867-a89b944bffe4'),
  activity('photo-1455729552865-3658a5d39692'),
  activity('photo-1502933691298-84fc14542831'),
  activity('photo-1530870110042-98b2cb110834'),
  activity('photo-1515862389136-e8f3ff731938'),
  activity('photo-1505459668311-8dfac7952bf0'),
  activity('photo-1509914398892-963f53e6e2f1'),
  activity('photo-1551524559-8af4e6624178'),
  activity('photo-1532622785990-d2c36a76f5a6'),
  activity('photo-1504701954957-2010ec3bcec1'),
  activity('photo-1517699418036-fb5d179fef0c'),
  activity('photo-1416339684178-3a239570f315'),
  activity('photo-1544552866-d3ed42f88b4c'),
];

/** ~15 trail / mountain / hiking photos */
const HIKING_PHOTOS: string[] = [
  activity('photo-1464822759023-fed622ff2c3b'),
  activity('photo-1500530855697-b586d89ba3ee'),
  activity('photo-1551632811-561732d1e306'),
  activity('photo-1505459668311-8dfac7952bf0'),
  activity('photo-1445363692815-ebcd599f7621'),
  activity('photo-1501555088652-021faa106b9b'),
  activity('photo-1476611338391-6f395a0ebc7b'),
  activity('photo-1522163182402-834f871fd851'),
  activity('photo-1485833077787-2289e29f3205'),
  activity('photo-1454496522488-7a8e488e8606'),
  activity('photo-1551632436-cbf8dd35adfa'),
  activity('photo-1519904981063-b0cf448d479e'),
  activity('photo-1530549387789-4c1017266635'),
  activity('photo-1504280390367-361c6d9f38f4'),
  activity('photo-1533240332313-0db49b459ad6'),
];

/** ~12 yoga / stretching / flexibility photos */
const YOGA_PHOTOS: string[] = [
  activity('photo-1518611012118-696072aa579a'),
  activity('photo-1544367567-0f2fcb009e0b'),
  activity('photo-1518310383802-640c2de311b2'),
  activity('photo-1545205597-3d9d02c29597'),
  activity('photo-1506126613408-eca07ce68773'),
  activity('photo-1575052814086-f385e2e2ad1b'),
  activity('photo-1588286840104-8957b019727f'),
  activity('photo-1510894347713-fc3ed6fdf539'),
  activity('photo-1573590330530-7ed413521e20'),
  activity('photo-1512291313931-d4291048e7b6'),
  activity('photo-1544367567-0f2fcb009e0b'),
  activity('photo-1549576490-b0b4831ef60a'),
];

/** ~15 gym / lifting / strength-training photos */
const GYM_PHOTOS: string[] = [
  activity('photo-1517838277536-f5f99be501cd'),
  activity('photo-1534438327276-14e5300c3a48'),
  activity('photo-1581009146145-b5ef050c2e1e'),
  activity('photo-1571019613454-1cb2f99b2d8b'),
  activity('photo-1574680096145-d05b474e2155'),
  activity('photo-1526506118085-60ce8714f8c5'),
  activity('photo-1583454110551-21f2fa2afe61'),
  activity('photo-1605296867304-46d5465a13f1'),
  activity('photo-1533681904393-9ab6ebed4d22'),
  activity('photo-1540497077202-7c8a3999166f'),
  activity('photo-1550345332-09e3ac987658'),
  activity('photo-1541534741688-6078c6bfb5c5'),
  activity('photo-1598971639058-fab3c3109a00'),
  activity('photo-1548690312-e3b507d8c110'),
  activity('photo-1532029837206-abbe2b7620e3'),
];

/** ~12 cycling / biking photos */
const CYCLING_PHOTOS: string[] = [
  activity('photo-1507035895480-2b3156c31fc8'),
  activity('photo-1540497077202-7c8a3999166f'),
  activity('photo-1517649763962-0c623066013b'),
  activity('photo-1541625602330-2277a4c46182'),
  activity('photo-1517836357463-d25dfeac3438'),
  activity('photo-1471506480208-91b3a4cc78be'),
  activity('photo-1534787238916-9ba6764efd4f'),
  activity('photo-1558618666-fcd25c85f82e'),
  activity('photo-1528629297340-d1d466945dc5'),
  activity('photo-1485965120184-e220f721d03e'),
  activity('photo-1517649763962-0c623066013b'),
  activity('photo-1505705694340-019e0d3423c0'),
];

/** ~12 swimming / ocean / pool photos */
const SWIMMING_PHOTOS: string[] = [
  activity('photo-1517836357463-d25dfeac3438'),
  activity('photo-1530549387789-4c1017266635'),
  activity('photo-1519046904884-53103b34b206'),
  activity('photo-1504701954957-2010ec3bcec1'),
  activity('photo-1530870110042-98b2cb110834'),
  activity('photo-1544551763-46a013bb70d5'),
  activity('photo-1519315901367-f34ff9154487'),
  activity('photo-1560090995-01632a28895b'),
  activity('photo-1527004013197-933c4588a3d3'),
  activity('photo-1575429198097-0414ec08e8cd'),
  activity('photo-1571008887538-b36bb32f4571'),
  activity('photo-1511886929837-354d827aae26'),
];

/** ~10 boxing / martial-arts photos */
const BOXING_PHOTOS: string[] = [
  activity('photo-1549719386-74dfcbf7dbed'),
  activity('photo-1517438322307-e67111335449'),
  activity('photo-1599058917212-d750089bc07e'),
  activity('photo-1544367567-0f2fcb009e0b'),
  activity('photo-1555597673-b21d5c935865'),
  activity('photo-1549719386-74dfcbf7dbed'),
  activity('photo-1517438322307-e67111335449'),
  activity('photo-1549824963-e08baeb06d02'),
  activity('photo-1544367567-0f2fcb009e0b'),
  activity('photo-1598971639058-fab3c3109a00'),
];

/** ~10 climbing / bouldering photos */
const CLIMBING_PHOTOS: string[] = [
  activity('photo-1522163182402-834f871fd851'),
  activity('photo-1564769662533-4f00a87b4056'),
  activity('photo-1504280390367-361c6d9f38f4'),
  activity('photo-1522163182402-834f871fd851'),
  activity('photo-1516592673884-4a382d1124c2'),
  activity('photo-1551632436-cbf8dd35adfa'),
  activity('photo-1452378174528-3090a4bba7b2'),
  activity('photo-1519904981063-b0cf448d479e'),
  activity('photo-1504280390367-361c6d9f38f4'),
  activity('photo-1485833077787-2289e29f3205'),
];

/** ~20 general beach / outdoor / social fitness photos */
const BEACH_LIFESTYLE_PHOTOS: string[] = [
  activity('photo-1519046904884-53103b34b206'),
  activity('photo-1507525428034-b723cf961d3e'),
  activity('photo-1505459668311-8dfac7952bf0'),
  activity('photo-1473496169904-658ba7c44d8a'),
  activity('photo-1504701954957-2010ec3bcec1'),
  activity('photo-1506953823645-5e1363c3e0a0'),
  activity('photo-1510414842594-a61c69b5ae57'),
  activity('photo-1516815231560-8f41ec531527'),
  activity('photo-1496442226666-8d4d0e62e6e9'),
  activity('photo-1509631179647-0177331693ae'),
  activity('photo-1507525428034-b723cf961d3e'),
  activity('photo-1530870110042-98b2cb110834'),
  activity('photo-1476611338391-6f395a0ebc7b'),
  activity('photo-1533240332313-0db49b459ad6'),
  activity('photo-1517649763962-0c623066013b'),
  activity('photo-1455729552865-3658a5d39692'),
  activity('photo-1523810192022-5a0fb9aa7ff8'),
  activity('photo-1445363692815-ebcd599f7621'),
  activity('photo-1544552866-d3ed42f88b4c'),
  activity('photo-1516939884455-1445c8652f83'),
];

/** ~15 group workouts, volleyball, paddling, dance photos */
const GROUP_FITNESS_PHOTOS: string[] = [
  activity('photo-1612872087720-bb876e2e67d1'),
  activity('photo-1526188717906-ab4a2f949f1a'),
  activity('photo-1508804185872-d7badad00f7d'),
  activity('photo-1518310383802-640c2de311b2'),
  activity('photo-1574680096145-d05b474e2155'),
  activity('photo-1534438327276-14e5300c3a48'),
  activity('photo-1526506118085-60ce8714f8c5'),
  activity('photo-1541534741688-6078c6bfb5c5'),
  activity('photo-1583454110551-21f2fa2afe61'),
  activity('photo-1571019613454-1cb2f99b2d8b'),
  activity('photo-1599058917212-d750089bc07e'),
  activity('photo-1552674605-469523170d9e'),
  activity('photo-1544367567-0f2fcb009e0b'),
  activity('photo-1517649763962-0c623066013b'),
  activity('photo-1596727362302-b8d891c42ab8'),
];

// ---------------------------------------------------------------------------
// Activity → pool mapping
// ---------------------------------------------------------------------------

const ACTIVITY_POOL_MAP: Record<string, string[]> = {
  running: RUNNING_PHOTOS,
  jogging: RUNNING_PHOTOS,
  trail_running: RUNNING_PHOTOS,
  surfing: SURFING_PHOTOS,
  surf: SURFING_PHOTOS,
  ocean: SURFING_PHOTOS,
  hiking: HIKING_PHOTOS,
  trail: HIKING_PHOTOS,
  backpacking: HIKING_PHOTOS,
  yoga: YOGA_PHOTOS,
  pilates: YOGA_PHOTOS,
  stretching: YOGA_PHOTOS,
  meditation: YOGA_PHOTOS,
  gym: GYM_PHOTOS,
  lifting: GYM_PHOTOS,
  weightlifting: GYM_PHOTOS,
  crossfit: GYM_PHOTOS,
  strength: GYM_PHOTOS,
  fitness: GYM_PHOTOS,
  cycling: CYCLING_PHOTOS,
  biking: CYCLING_PHOTOS,
  mountain_biking: CYCLING_PHOTOS,
  swimming: SWIMMING_PHOTOS,
  diving: SWIMMING_PHOTOS,
  boxing: BOXING_PHOTOS,
  mma: BOXING_PHOTOS,
  martial_arts: BOXING_PHOTOS,
  kickboxing: BOXING_PHOTOS,
  climbing: CLIMBING_PHOTOS,
  bouldering: CLIMBING_PHOTOS,
  rock_climbing: CLIMBING_PHOTOS,
  beach: BEACH_LIFESTYLE_PHOTOS,
  paddling: GROUP_FITNESS_PHOTOS,
  kayaking: GROUP_FITNESS_PHOTOS,
  dance: GROUP_FITNESS_PHOTOS,
  volleyball: GROUP_FITNESS_PHOTOS,
  group_fitness: GROUP_FITNESS_PHOTOS,
};

// ---------------------------------------------------------------------------
// Deterministic hash
// ---------------------------------------------------------------------------

function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // unsigned 32-bit
}

function getPortraitPoolForGender(gender?: Gender): string[] {
  switch (gender) {
    case Gender.FEMALE:
      return FEMALE_PORTRAIT_PHOTOS;
    case Gender.MALE:
      return MALE_PORTRAIT_PHOTOS;
    case Gender.NON_BINARY:
      return NON_BINARY_PORTRAIT_PHOTOS;
    default:
      return ALL_REVIEWED_PORTRAIT_PHOTOS;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return a deterministic set of photo URLs for a seed user.
 *
 * @param slug       Unique user slug (e.g. "lana-k")
 * @param photoCount How many photos to return (typically 4-6)
 * @param activities List of activity tags for the user (e.g. ["surfing","yoga"])
 * @param gender     Seeded gender used to choose a reviewed lead portrait pool
 */
export function getPhotosForUser(
  slug: string,
  photoCount: number,
  activities: string[],
  gender?: Gender,
): string[] {
  const hash = simpleHash(slug);
  const used = new Set<string>();
  const result: string[] = [];

  // 1. Pick a portrait as the primary photo
  const portraitPool = getPortraitPoolForGender(gender);
  const portraitIdx = hash % portraitPool.length;
  const primary = portraitPool[portraitIdx];
  result.push(primary);
  used.add(primary);

  // 2. Collect candidate pools from the user's activities
  const activityPools: string[][] = [];
  for (const act of activities) {
    const key = act.toLowerCase().replace(/[\s-]+/g, '_');
    const pool = ACTIVITY_POOL_MAP[key];
    if (pool) activityPools.push(pool);
  }

  // 3. Round-robin through activity pools for remaining slots
  let poolCursor = 0;
  let offsetInPool = hash;

  while (result.length < photoCount && activityPools.length > 0) {
    const pool = activityPools[poolCursor % activityPools.length];
    const idx = offsetInPool % pool.length;
    const candidate = pool[idx];

    if (!used.has(candidate)) {
      result.push(candidate);
      used.add(candidate);
    }

    offsetInPool++;
    poolCursor++;

    // Safety: if we've cycled too many times, break to fallback
    if (poolCursor > photoCount * activityPools.length * 2) break;
  }

  // 4. Fill remaining slots from BEACH_LIFESTYLE_PHOTOS as fallback
  let fallbackIdx = hash;
  while (result.length < photoCount) {
    const candidate =
      BEACH_LIFESTYLE_PHOTOS[fallbackIdx % BEACH_LIFESTYLE_PHOTOS.length];
    if (!used.has(candidate)) {
      result.push(candidate);
      used.add(candidate);
    }
    fallbackIdx++;

    // Last-resort: if we somehow exhaust all fallbacks, pull from GROUP_FITNESS
    if (fallbackIdx - hash > BEACH_LIFESTYLE_PHOTOS.length * 2) {
      let gIdx = hash;
      while (result.length < photoCount) {
        const g = GROUP_FITNESS_PHOTOS[gIdx % GROUP_FITNESS_PHOTOS.length];
        if (!used.has(g)) {
          result.push(g);
          used.add(g);
        }
        gIdx++;
        if (gIdx - hash > GROUP_FITNESS_PHOTOS.length * 2) break;
      }
      break;
    }
  }

  return result.slice(0, photoCount);
}

// ---------------------------------------------------------------------------
// Legacy compatibility
// ---------------------------------------------------------------------------

/** Original placeholder avatar filenames used before Unsplash migration. */
export const LEGACY_PHOTO_FILES = [
  'uifaces-human-avatar.jpg',
  'uifaces-human-avatar (1).jpg',
  'uifaces-human-avatar (2).jpg',
  'uifaces-human-avatar (3).jpg',
  'uifaces-human-avatar (4).jpg',
  'uifaces-human-avatar (5).jpg',
  'uifaces-human-avatar (6).jpg',
  'uifaces-human-avatar (7).jpg',
  'uifaces-human-avatar (8).jpg',
  'uifaces-human-avatar (9).jpg',
  'uifaces-human-avatar (10).jpg',
  'uifaces-human-avatar (11).jpg',
];
