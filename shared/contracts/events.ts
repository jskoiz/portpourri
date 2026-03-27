import { z } from "zod";
import { UserStubSchema } from "./common";

// ── Shared host stub ────────────────────────────────────────────────

const EventHostSchema = z.object({
  id: z.string(),
  firstName: z.string(),
});

// ── GET /events, GET /events/:id, GET /events/me ────────────────────

export const EventSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  location: z.string(),
  imageUrl: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  host: EventHostSchema,
  attendeesCount: z.number(),
  joined: z.boolean(),
});

export const EventListSchema = z.array(EventSummarySchema);

export type EventSummary = z.infer<typeof EventSummarySchema>;

export const EventAttendeeSchema = UserStubSchema;

export const EventDetailSchema = EventSummarySchema.extend({
  attendees: z.array(EventAttendeeSchema),
});

export type EventAttendee = z.infer<typeof EventAttendeeSchema>;
export type EventDetail = z.infer<typeof EventDetailSchema>;

// ── POST /events/:id/rsvp ───────────────────────────────────────────

export const EventRsvpResponseSchema = z.object({
  status: z.literal("joined"),
  attendeesCount: z.number(),
});

export type EventRsvpResponse = z.infer<typeof EventRsvpResponseSchema>;

// ── POST /events/:id/invite ─────────────────────────────────────────

export const EventInviteResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  event: z.object({
    id: z.string(),
    title: z.string(),
    location: z.string(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().nullable().optional(),
    category: z.string().nullable().optional(),
    host: EventHostSchema,
    attendeesCount: z.number(),
  }),
});

export type EventInviteResponse = z.infer<typeof EventInviteResponseSchema>;

// ── GET /events/:id/invites ─────────────────────────────────────────

export const EventInviteListItemSchema = z.object({
  id: z.string(),
  status: z.string(),
  createdAt: z.coerce.date(),
  inviter: EventHostSchema,
  invitee: EventHostSchema,
});

export const EventInviteListSchema = z.array(EventInviteListItemSchema);

export type EventInviteListItem = z.infer<typeof EventInviteListItemSchema>;
