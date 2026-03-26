import client from '../../api/client';
import type { ChatMessage, Match, SendMessageResponse } from '../../api/types';
import { withErrorLogging } from './shared';

export const matchesApi = {
  list: async () =>
    withErrorLogging('matches', 'list', () =>
      client.get<Match[]>('/matches'),
    ),
  getMessages: async (matchId: string) =>
    withErrorLogging('matches', 'getMessages', () =>
      client.get<ChatMessage[]>(`/matches/${matchId}/messages`),
      { matchId },
    ),
  sendMessage: async (matchId: string, content: string) =>
    withErrorLogging('matches', 'sendMessage', () =>
      client.post<SendMessageResponse>(`/matches/${matchId}/messages`, { content }),
      { matchId },
    ),
};
