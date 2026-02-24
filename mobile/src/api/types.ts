export interface UserProfile {
  bio?: string;
  city?: string;
  intentDating?: boolean;
  intentWorkout?: boolean;
  intentFriends?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface FitnessProfile {
  intensityLevel?: string;
  weeklyFrequencyBand?: string;
  primaryGoal?: string;
  secondaryGoal?: string;
  favoriteActivities?: string;
  prefersMorning?: boolean;
  prefersEvening?: boolean;
}

export interface UserPhoto {
  id?: string;
  storageKey?: string;
  isPrimary?: boolean;
}

export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  hasVerifiedEmail?: boolean;
  hasVerifiedPhone?: boolean;
  firstName?: string;
  age?: number;
  distanceKm?: number | null;
  recommendationScore?: number;
  isOnboarded?: boolean;
  photoUrl?: string;
  profile?: UserProfile;
  fitnessProfile?: FitnessProfile;
  photos?: UserPhoto[];
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Match {
  id: string;
  user: User;
  lastMessage?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: string;
  timestamp?: string | Date;
}

export interface LikeResponse {
  status: "match" | "liked";
  match?: {
    id: string;
  };
}

export interface UndoSwipeResponse {
  status: "undone" | "nothing_to_undo";
  action?: "like" | "pass";
  targetUserId?: string;
}

export interface ProfileCompletenessResponse {
  score: number;
  prompts: string[];
}

export interface EventSummary {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  imageUrl?: string | null;
  category?: string | null;
  startsAt: string;
  endsAt?: string | null;
  host: { id: string; firstName: string };
  attendeesCount: number;
  joined: boolean;
}

export type EventDetail = EventSummary;

export interface EventRsvpResponse {
  status: "joined";
  attendeesCount: number;
}

export interface ApiErrorPayload {
  message?: string;
  error?: string;
  code?: string;
}
