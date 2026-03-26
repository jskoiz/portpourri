import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '../../../api/types';
import { profileApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';
import { invalidateProfileSurfaces } from '../../../lib/query/queryInvalidation';
import { useAuthStore } from '../../../store/authStore';
import { useEffect } from 'react';

/** Sync the returned User back into authStore so screens reading authStore.user stay current. */
function syncUserToAuthStore(user: User) {
  useAuthStore.getState().setUser(user);
}

function syncUserToCaches(queryClient: ReturnType<typeof useQueryClient>, user: User) {
  queryClient.setQueryData(queryKeys.profile.current(), user);
  syncUserToAuthStore(user);
}

export function useProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.profile.current(),
    queryFn: async (): Promise<User> => (await profileApi.getProfile()).data,
  });

  useEffect(() => {
    if (query.data) {
      syncUserToAuthStore(query.data);
    }
  }, [query.data]);

  const updateFitness = useMutation({
    mutationFn: profileApi.updateFitness,
    onSuccess: (response) => {
      syncUserToCaches(queryClient, response.data);
      void invalidateProfileSurfaces(queryClient);
    },
  });
  const updateProfile = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (response) => {
      syncUserToCaches(queryClient, response.data);
      void invalidateProfileSurfaces(queryClient);
    },
  });
  const uploadPhoto = useMutation({
    mutationFn: profileApi.uploadPhoto,
    onSuccess: (response) => {
      syncUserToCaches(queryClient, response.data);
      void invalidateProfileSurfaces(queryClient);
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
    onSuccess: (response) => {
      syncUserToCaches(queryClient, response.data);
      void invalidateProfileSurfaces(queryClient);
    },
  });
  const deletePhoto = useMutation({
    mutationFn: profileApi.deletePhoto,
    onSuccess: (response) => {
      syncUserToCaches(queryClient, response.data);
      void invalidateProfileSurfaces(queryClient);
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
