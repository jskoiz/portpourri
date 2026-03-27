import { SeedMatch, SeedLike, SeedPass, SeedEventInvite } from './config';
import { datingMatches } from './matches-dating';
import { workoutMatches } from './matches-workout';
import { mixedMatches } from './matches-mixed';
import { seedLikes } from './likes';
import { seedPasses } from './passes';
import { seedEventInvites } from './event-invites';

export const allMatches: SeedMatch[] = [
  ...datingMatches,
  ...workoutMatches,
  ...mixedMatches,
];

export const allLikes: SeedLike[] = seedLikes;
export const allPasses: SeedPass[] = seedPasses;
export const allEventInvites: SeedEventInvite[] = seedEventInvites;

// Validate no duplicate match slugs
const matchSlugs = new Set<string>();
for (const m of allMatches) {
  if (matchSlugs.has(m.slug)) {
    console.warn(`Duplicate match slug: ${m.slug}`);
  }
  matchSlugs.add(m.slug);
}

// Validate no duplicate like pairs
const likePairs = new Set<string>();
for (const l of allLikes) {
  const pair = `${l.fromSlug}->${l.toSlug}`;
  if (likePairs.has(pair)) {
    console.warn(`Duplicate like pair: ${pair}`);
  }
  likePairs.add(pair);
}

// Validate no duplicate pass pairs
const passPairs = new Set<string>();
for (const p of allPasses) {
  const pair = `${p.fromSlug}->${p.toSlug}`;
  if (passPairs.has(pair)) {
    console.warn(`Duplicate pass pair: ${pair}`);
  }
  passPairs.add(pair);
}

console.log(`Social graph: ${allMatches.length} matches, ${allLikes.length} likes, ${allPasses.length} passes, ${allEventInvites.length} invites`);
