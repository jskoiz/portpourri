import client from '../../api/client';
import type {
  CreateEventPayload,
  EventDetail,
  EventInviteListItem,
  EventInviteResponse,
  EventRsvpResponse,
  EventSummary,
} from '../../api/types';
import { withErrorLogging } from './shared';

export const eventsApi = {
  list: async () =>
    withErrorLogging('events', 'list', () =>
      client.get<EventSummary[]>('/events'),
    ),
  create: async (payload: CreateEventPayload) =>
    withErrorLogging('events', 'create', () =>
      client.post<EventSummary>('/events', payload),
      { title: payload.title, category: payload.category },
    ),
  detail: async (id: string) =>
    withErrorLogging('events', 'detail', () =>
      client.get<EventDetail>(`/events/${id}`),
      { id },
    ),
  rsvp: async (id: string) =>
    withErrorLogging('events', 'rsvp', () =>
      client.post<EventRsvpResponse>(`/events/${id}/rsvp`),
      { id },
    ),
  mine: async () =>
    withErrorLogging('events', 'mine', () =>
      client.get<EventSummary[]>('/events/me'),
    ),
  invite: async (eventId: string, matchId: string, message?: string) =>
    withErrorLogging('events', 'invite', () =>
      client.post<EventInviteResponse>(`/events/${eventId}/invite`, {
        matchId,
        ...(message ? { message } : {}),
      }),
      { eventId, matchId },
    ),
  getInvites: async (eventId: string) =>
    withErrorLogging('events', 'getInvites', () =>
      client.get<EventInviteListItem[]>(`/events/${eventId}/invites`),
      { eventId },
    ),
};
