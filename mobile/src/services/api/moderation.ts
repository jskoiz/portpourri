import client from '../../api/client';
import type { BlockPayload, BlockResponse, ReportPayload, ReportResponse } from '../../api/types';
import { withErrorLogging } from './shared';

export const moderationApi = {
  report: async (payload: ReportPayload) =>
    withErrorLogging('moderation', 'report', () =>
      client.post<ReportResponse>('/moderation/report', payload),
      {
        context: {
          reportedUserId: payload.reportedUserId,
          category: payload.category,
          hasDescription: Boolean(payload.description?.trim()),
          hasMatchId: Boolean(payload.matchId),
        },
      },
    ),
  block: async (payload: BlockPayload) =>
    withErrorLogging('moderation', 'block', () =>
      client.post<BlockResponse>('/moderation/block', payload),
      {
        context: {
          targetUserId: payload.targetUserId,
          hasMatchId: Boolean(payload.matchId),
        },
      },
    ),
};
