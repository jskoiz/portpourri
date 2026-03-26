import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, UserProfile } from '../../../api/types';
import { profileApi } from '../../../services/api';
import { queryKeys } from '../../../lib/query/queryKeys';
import { invalidateProfileSurfaces } from '../../../lib/query/queryInvalidation';
import { useAuthStore } from '../../../store/authStore';

/** Sync the returned User back into authStore so screens reading authStore.user stay current. */
function syncUserToAuthStore(response: { data: User }) {
  useAuthStore.getState().setUser(response.data);
}

function syncUserProfileToAuthStore(response: { data: UserProfile & { userId: string } }) {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser) {
    return;
  }

  const { userId: _userId, ...profile } = response.data;
  useAuthStore.getState().setUser({
    ...currentUser,
    profile: {
      ...currentUser.profile,
      ...profile,
    },
  });
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
      void invalidateProfileSurfaces(queryClient);
    },
  });
  const updateProfile = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (response) => {
      syncUserProfileToAuthStore(response);
      void invalidateProfileSurfaces(queryClient);
    },
  });
  const uploadPhoto = useMutation({
    mutationFn: profileApi.uploadPhoto,
    onSuccess: () => {
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
    onSuccess: () => {
      void invalidateProfileSurfaces(queryClient);
    },
  });
  const deletePhoto = useMutation({
    mutationFn: profileApi.deletePhoto,
    onSuccess: () => {
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
