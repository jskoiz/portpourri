import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';

export function useProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: async () => (await profileApi.getProfile()).data,
  });

  const updateFitness = useMutation({
    mutationFn: profileApi.updateFitness,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile.current });
      void queryClient.invalidateQueries({ queryKey: queryKeys.discovery.feed({}) });
    },
  });

  return {
    ...query,
    profile: query.data ?? null,
    updateFitness: updateFitness.mutateAsync,
    isSavingFitness: updateFitness.isPending,
  };
}
