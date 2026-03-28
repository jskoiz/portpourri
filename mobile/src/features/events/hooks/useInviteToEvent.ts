import { useMutation } from '@tanstack/react-query';
import { eventsApi } from '../../../services/api/events';

export function useInviteToEvent() {
  const mutation = useMutation({
    mutationFn: async ({ eventId, matchId }: { eventId: string; matchId: string }) =>
      eventsApi.invite(eventId, matchId),
  });

  return {
    invite: mutation.mutateAsync,
    isInviting: mutation.isPending,
  };
}
