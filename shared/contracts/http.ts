import type { ZodType } from "zod";
import {
  AuthResponseSchema,
  CurrentUserSchema,
} from "./auth";
import {
  DiscoveryFeedSchema,
  LikeResponseSchema,
  PassResponseSchema,
  ProfileCompletenessSchema,
  UndoSwipeResponseSchema,
} from "./discovery";
import {
  EventDetailSchema,
  EventInviteListSchema,
  EventInviteResponseSchema,
  EventListSchema,
  EventRsvpResponseSchema,
  EventSummarySchema,
} from "./events";
import {
  ChatMessageListSchema,
  MatchListSchema,
  SendMessageResponseSchema,
} from "./matches";

export type ContractMethod = "GET" | "POST";

export type ResponseContract = {
  method: ContractMethod;
  path: string;
  pattern: RegExp;
  responseSchema: ZodType;
};

export const responseContracts: ResponseContract[] = [
  { method: "POST", path: "/auth/login", pattern: /^\/auth\/login$/, responseSchema: AuthResponseSchema },
  { method: "POST", path: "/auth/signup", pattern: /^\/auth\/signup$/, responseSchema: AuthResponseSchema },
  { method: "GET", path: "/auth/me", pattern: /^\/auth\/me$/, responseSchema: CurrentUserSchema },
  { method: "GET", path: "/discovery/feed", pattern: /^\/discovery\/feed$/, responseSchema: DiscoveryFeedSchema },
  { method: "POST", path: "/discovery/like/:id", pattern: /^\/discovery\/like\/[^/]+$/, responseSchema: LikeResponseSchema },
  { method: "POST", path: "/discovery/pass/:id", pattern: /^\/discovery\/pass\/[^/]+$/, responseSchema: PassResponseSchema },
  { method: "POST", path: "/discovery/undo", pattern: /^\/discovery\/undo$/, responseSchema: UndoSwipeResponseSchema },
  {
    method: "GET",
    path: "/discovery/profile-completeness",
    pattern: /^\/discovery\/profile-completeness$/,
    responseSchema: ProfileCompletenessSchema,
  },
  { method: "GET", path: "/matches", pattern: /^\/matches$/, responseSchema: MatchListSchema },
  {
    method: "GET",
    path: "/matches/:id/messages",
    pattern: /^\/matches\/[^/]+\/messages$/,
    responseSchema: ChatMessageListSchema,
  },
  {
    method: "POST",
    path: "/matches/:id/messages",
    pattern: /^\/matches\/[^/]+\/messages$/,
    responseSchema: SendMessageResponseSchema,
  },
  { method: "GET", path: "/events", pattern: /^\/events$/, responseSchema: EventListSchema },
  { method: "GET", path: "/events/me", pattern: /^\/events\/me$/, responseSchema: EventListSchema },
  { method: "GET", path: "/events/:id", pattern: /^\/events\/[^/]+$/, responseSchema: EventDetailSchema },
  { method: "POST", path: "/events", pattern: /^\/events$/, responseSchema: EventSummarySchema },
  {
    method: "POST",
    path: "/events/:id/rsvp",
    pattern: /^\/events\/[^/]+\/rsvp$/,
    responseSchema: EventRsvpResponseSchema,
  },
  {
    method: "POST",
    path: "/events/:id/invite",
    pattern: /^\/events\/[^/]+\/invite$/,
    responseSchema: EventInviteResponseSchema,
  },
  {
    method: "GET",
    path: "/events/:id/invites",
    pattern: /^\/events\/[^/]+\/invites$/,
    responseSchema: EventInviteListSchema,
  },
];

export function normalizeContractPath(url: string, baseURL = ""): string {
  let normalized = url;
  if (baseURL && normalized.startsWith(baseURL)) {
    normalized = normalized.slice(baseURL.length);
  }

  const queryIndex = normalized.indexOf("?");
  if (queryIndex >= 0) {
    normalized = normalized.slice(0, queryIndex);
  }

  const hashIndex = normalized.indexOf("#");
  if (hashIndex >= 0) {
    normalized = normalized.slice(0, hashIndex);
  }

  // Strip trailing slashes and ensure leading slash
  normalized = normalized.replace(/\/+$/, "");
  if (!normalized) return "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function findResponseContract(
  method: string,
  url: string,
  baseURL = "",
): ResponseContract | undefined {
  const normalizedMethod = method.toUpperCase() as ContractMethod;
  const normalizedPath = normalizeContractPath(url, baseURL);
  return responseContracts.find(
    (route) => route.method === normalizedMethod && route.pattern.test(normalizedPath),
  );
}
