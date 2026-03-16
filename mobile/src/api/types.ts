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
  id: string;
  storageKey: string;
  isPrimary: boolean;
  isHidden: boolean;
  sortOrder: number;
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

export interface UpdateProfilePayload {
  bio?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  intentDating?: boolean;
  intentWorkout?: boolean;
  intentFriends?: boolean;
}

export interface UpdateFitnessPayload {
  intensityLevel: string;
  weeklyFrequencyBand: string;
  primaryGoal: string;
  favoriteActivities: string;
  prefersMorning?: boolean;
  prefersEvening?: boolean;
}

export interface UploadPhotoPayload {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  onProgress?: (progress: number) => void;
}

export interface UpdatePhotoPayload {
  isPrimary?: boolean;
  isHidden?: boolean;
  sortOrder?: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Match {
  id: string;
  createdAt: string | Date;
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
  status: "match" | "liked" | "already_liked";
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

export interface CreateEventPayload {
  title: string;
  description?: string;
  location: string;
  category?: string;
  startsAt: string;
  endsAt?: string;
}

export interface EventRsvpResponse {
  status: "joined";
  attendeesCount: number;
}

export type NotificationType =
  | 'like_received'
  | 'match_created'
  | 'message_received'
  | 'event_rsvp'
  | 'event_reminder'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt: string | Date | null;
  createdAt: string | Date;
}

export interface ApiErrorPayload {
  message?: string;
  error?: string;
  code?: string;
}
