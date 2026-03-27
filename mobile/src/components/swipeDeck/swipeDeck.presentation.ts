import {
  getIntentLabel,
  getPresenceLabel,
  getProfileChips,
  getTempoLabel,
} from '../../lib/profile-helpers';
import { getPrimaryPhotoUri } from '../../lib/profilePhotos';
import type { SwipeDeckUser } from './swipeDeck.types';

const DEFAULT_CARD_HEIGHT = 520;
const MIN_CARD_HEIGHT = 300;
const MAX_CARD_HEIGHT = 680;
const DEFAULT_BIO =
  'Aligned on rhythm, intent, and the kind of plans that actually happen.';

interface SwipeDeckCardDensity {
  compact: boolean;
  ultraCompact: boolean;
}

export interface SwipeDeckCardViewModel extends SwipeDeckCardDensity {
  alignmentLabel: string | null;
  bio: string;
  chips: string[];
  locationLine: string;
  nameLine: string;
  presenceLabel: string;
  intentLabel: string;
  primaryPhoto: string | undefined;
  tempoLabel: string;
}

function getCardDensity(cardHeight: number): SwipeDeckCardDensity {
  return {
    compact: cardHeight < 390,
    ultraCompact: cardHeight < 350,
  };
}

function getAlignmentLabel(score?: number) {
  if (typeof score !== 'number' || Number.isNaN(score)) return null;
  const normalizedScore = score <= 1 ? score * 100 : score;
  const percentage = Math.max(0, Math.min(100, Math.round(normalizedScore)));
  return `${percentage}% aligned`;
}

function formatDistanceLabel(distanceKm?: number | null) {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm)) return '';
  return ` · ${Math.round(distanceKm)} km away`;
}

export function clampCardHeight(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return DEFAULT_CARD_HEIGHT;
  return Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_HEIGHT, Math.round(value)));
}

export function buildSwipeDeckCardViewModel(
  user: SwipeDeckUser,
  cardHeight: number,
): SwipeDeckCardViewModel {
  const density = getCardDensity(cardHeight);
  const chips = getProfileChips(user);
  const visibleChips = density.ultraCompact
    ? []
    : density.compact
      ? chips.slice(0, 1)
      : chips;

  return {
    ...density,
    alignmentLabel: getAlignmentLabel(user.recommendationScore),
    bio: user.profile?.bio || DEFAULT_BIO,
    chips: visibleChips.length > 0 ? visibleChips : density.ultraCompact ? [] : ['Nearby'],
    locationLine: `${user.profile?.city || 'Nearby'}${formatDistanceLabel(user.distanceKm)}`,
    nameLine: `${user.firstName || 'Someone'}${user.age ? `, ${user.age}` : ''}`,
    presenceLabel: getPresenceLabel(user),
    intentLabel: getIntentLabel(user),
    primaryPhoto: getPrimaryPhotoUri(user),
    tempoLabel: getTempoLabel(user),
  };
}
