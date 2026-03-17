import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';
import { useAuthStore } from '../../../store/authStore';

function invalidateProfileSurfaces(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.profile.current });
  void queryClient.invalidateQueries({ queryKey: queryKeys.discovery.feed({}) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.matches.list });
}

/** Sync the returned User back into authStore so screens reading authStore.user stay current. */
function syncUserToAuthStore(response: { data: import('../../../api/types').User }) {
  useAuthStore.getState().setUser(response.data);
}

export function useProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: async () => (await profileApi.getProfile()).data,
  });

  const updateFitness = useMutation({
    mutationFn: profileApi.updateFitness,
    onSuccess: (response) => {
      syncUserToAuthStore(response);
      invalidateProfileSurfaces(queryClient);
    },
  });
  const updateProfile = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (response) => {
      syncUserToAuthStore(response);
      invalidateProfileSurfaces(queryClient);
    },
  });
  const uploadPhoto = useMutation({
    mutationFn: profileApi.uploadPhoto,
    onSuccess: () => {
      invalidateProfileSurfaces(queryClient);
    },
  });
  const updatePhoto = useMutation({
    mutationFn: async ({
      photoId,
      payload,
    }: {
      photoId: string;
      payload: Parameters<typeof profileApi.updatePhoto>[1];
    }) => profileApi.updatePhoto(photoId, payload),
    onSuccess: () => {
      invalidateProfileSurfaces(queryClient);
    },
  });
  const deletePhoto = useMutation({
    mutationFn: profileApi.deletePhoto,
    onSuccess: () => {
      invalidateProfileSurfaces(queryClient);
    },
  });

  return {
    ...query,
    profile: query.data ?? null,
    updateFitness: updateFitness.mutateAsync,
    updateProfile: updateProfile.mutateAsync,
    uploadPhoto: uploadPhoto.mutateAsync,
    updatePhoto: updatePhoto.mutateAsync,
    deletePhoto: deletePhoto.mutateAsync,
    isSavingFitness: updateFitness.isPending,
    isSavingProfile: updateProfile.isPending,
    isUploadingPhoto: uploadPhoto.isPending,
    isUpdatingPhoto: updatePhoto.isPending,
    isDeletingPhoto: deletePhoto.isPending,
  };
}
