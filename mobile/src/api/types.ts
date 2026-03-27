import { z } from "zod";
import {
  AuthResponseSchema as SharedAuthResponseSchema,
  CurrentUserSchema as SharedCurrentUserSchema,
  DiscoveryUserSchema as SharedDiscoveryUserSchema,
  LikeResponseSchema as SharedLikeResponseSchema,
  PassResponseSchema as SharedPassResponseSchema,
  UndoSwipeResponseSchema as SharedUndoSwipeResponseSchema,
  ProfileCompletenessSchema as SharedProfileCompletenessSchema,
  MatchSchema as SharedMatchSchema,
  ChatMessageSchema as SharedChatMessageSchema,
  SendMessageResponseSchema as SharedSendMessageResponseSchema,
  EventSummarySchema as SharedEventSummarySchema,
  EventRsvpResponseSchema as SharedEventRsvpResponseSchema,
  EventInviteResponseSchema as SharedEventInviteResponseSchema,
  EventInviteListItemSchema as SharedEventInviteListItemSchema,
  EventDetailSchema as SharedEventDetailSchema,
  UserProfileSchema as SharedUserProfileSchema,
  FitnessProfileSchema as SharedFitnessProfileSchema,
  UserPhotoSchema as SharedUserPhotoSchema,
} from "@contracts";

type Jsonify<T> = T extends Date
  ? string
  : T extends readonly (infer U)[]
    ? Jsonify<U>[]
    : T extends null | undefined
      ? T
      : T extends object
        ? { [K in keyof T]: Jsonify<T[K]> }
        : T;

export const UserProfileSchema = SharedUserProfileSchema.extend({
  country: z.string().nullable().optional(),
});
export const FitnessProfileSchema = SharedFitnessProfileSchema;
export const UserPhotoSchema = SharedUserPhotoSchema.extend({
  isHidden: z.boolean(),
});

export const AuthResponseSchema = SharedAuthResponseSchema;
export const CurrentUserSchema = SharedCurrentUserSchema.extend({
  photos: z.array(UserPhotoSchema),
});
export const DiscoveryUserSchema = SharedDiscoveryUserSchema.extend({
  photos: z.array(UserPhotoSchema),
});
export const DiscoveryFeedSchema = z.array(DiscoveryUserSchema);
export const LikeResponseSchema = SharedLikeResponseSchema;
export const PassResponseSchema = SharedPassResponseSchema;
export const UndoSwipeResponseSchema = SharedUndoSwipeResponseSchema;
export const ProfileCompletenessSchema = SharedProfileCompletenessSchema;
export const MatchSchema = SharedMatchSchema;
export const MatchListSchema = z.array(MatchSchema);
export const ChatMessageSchema = SharedChatMessageSchema;
export const ChatMessageListSchema = z.array(ChatMessageSchema);
export const SendMessageResponseSchema = SharedSendMessageResponseSchema;
export const EventSummarySchema = SharedEventSummarySchema;
export const EventDetailSchema = SharedEventDetailSchema;
export const EventListSchema = z.array(EventSummarySchema);
export const EventRsvpResponseSchema = SharedEventRsvpResponseSchema;
export const EventInviteResponseSchema = SharedEventInviteResponseSchema;
export const EventInviteListItemSchema = SharedEventInviteListItemSchema;
export const EventInviteListSchema = z.array(EventInviteListItemSchema);

export type UserProfile = Jsonify<z.infer<typeof UserProfileSchema>>;
export type FitnessProfile = Jsonify<z.infer<typeof FitnessProfileSchema>>;
export type UserPhoto = Jsonify<z.infer<typeof UserPhotoSchema>>;

export type AuthResponse = Jsonify<z.infer<typeof AuthResponseSchema>>;
export type AuthenticatedUser = AuthResponse["user"];
export type CurrentUser = Jsonify<z.infer<typeof CurrentUserSchema>>;
export type DiscoveryUser = Jsonify<z.infer<typeof DiscoveryUserSchema>>;

export type User = {
  id: string;
  email?: string | null;
  phoneNumber?: string | null;
  hasVerifiedEmail?: boolean;
  hasVerifiedPhone?: boolean;
  firstName?: string;
  age?: number | null;
  gender?: string | null;
  isOnboarded?: boolean;
  showMeMen?: boolean;
  showMeWomen?: boolean;
  photoUrl?: string | null;
  profile?: UserProfile | null;
  fitnessProfile?: FitnessProfile | null;
  photos?: UserPhoto[];
};

export type LikeResponse = Jsonify<z.infer<typeof LikeResponseSchema>>;
export type PassResponse = Jsonify<z.infer<typeof PassResponseSchema>>;
export type UndoSwipeResponse = Jsonify<z.infer<typeof UndoSwipeResponseSchema>>;
export type ProfileCompleteness = Jsonify<
  z.infer<typeof ProfileCompletenessSchema>
>;
export type ProfileCompletenessMissingItem =
  ProfileCompleteness["missing"][number];
export type ProfileCompletenessResponse = ProfileCompleteness;
export type Match = Jsonify<z.infer<typeof MatchSchema>>;
export type ChatMessage = Jsonify<z.infer<typeof ChatMessageSchema>>;
export type SendMessageResponse = Jsonify<
  z.infer<typeof SendMessageResponseSchema>
>;
export type EventSummary = Jsonify<z.infer<typeof EventSummarySchema>>;
export type EventDetail = Jsonify<z.infer<typeof EventDetailSchema>>;
export interface CreateEventPayload {
  title: string;
  description?: string;
  location: string;
  category?: string;
  startsAt: string;
  endsAt?: string;
}
export type EventRsvpResponse = Jsonify<z.infer<typeof EventRsvpResponseSchema>>;
export type EventInviteResponse = Jsonify<
  z.infer<typeof EventInviteResponseSchema>
>;
export type EventInviteListItem = Jsonify<
  z.infer<typeof EventInviteListItemSchema>
>;

export interface UpdateProfilePayload {
  bio?: string;
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  intentDating?: boolean;
  intentWorkout?: boolean;
  intentFriends?: boolean;
  showMeMen?: boolean;
  showMeWomen?: boolean;
}

export interface UpdateFitnessPayload {
  intensityLevel?: string;
  weeklyFrequencyBand?: string;
  primaryGoal?: string;
  favoriteActivities?: string;
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

export type NotificationType =
  | 'like_received'
  | 'match_created'
  | 'message_received'
  | 'event_rsvp'
  | 'event_invite'
  | 'event_reminder'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface ApiErrorPayload {
  message?: string;
  error?: string;
  code?: string;
}

export type ReportCategory =
  | "HARASSMENT"
  | "SPAM"
  | "FAKE_PROFILE"
  | "INAPPROPRIATE"
  | "OTHER";

export interface ReportPayload {
  reportedUserId: string;
  matchId?: string;
  category: ReportCategory;
  description?: string;
}

export interface BlockPayload {
  targetUserId: string;
  matchId?: string;
}

export const ReportResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
});
export const BlockResponseSchema = z.object({
  success: z.boolean(),
  matchId: z.string().nullable(),
});

export type ReportResponse = Jsonify<z.infer<typeof ReportResponseSchema>>;
export type BlockResponse = Jsonify<z.infer<typeof BlockResponseSchema>>;
