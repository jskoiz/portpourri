import { useState } from 'react';
import { Alert } from 'react-native';
import { normalizeApiError } from '../../../api/errors';
import { useAuthStore } from '../../../store/authStore';
import { useKnownLocationSuggestions } from '../../locations/useKnownLocationSuggestions';
import { useProfile } from './useProfile';
import { useProfileCompleteness } from './useProfileCompleteness';
import { useProfileEditor } from './useProfileEditor';
import { usePhotoManager } from './usePhotoManager';
import { useProfileSettings } from './useProfileSettings';
import { triggerErrorHaptic } from '../../../lib/interaction/feedback';

export function useProfileScreenController() {
  const logout = useAuthStore((state) => state.logout);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const profileQuery = useProfile();
  const { score: completenessScore, missing: completenessMissing } = useProfileCompleteness();
  const knownLocationSuggestions = useKnownLocationSuggestions();
  const settings = useProfileSettings();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const editor = useProfileEditor({
    profile: profileQuery.profile,
    updateFitness: profileQuery.updateFitness,
    updateProfile: profileQuery.updateProfile,
  });
  const photos = usePhotoManager({
    profile: profileQuery.profile,
    refetch: profileQuery.refetch,
    uploadPhoto: profileQuery.uploadPhoto,
    updatePhoto: profileQuery.updatePhoto,
    deletePhoto: profileQuery.deletePhoto,
    setError: editor.setError,
  });

  const errorMessage =
    editor.error ?? (profileQuery.error ? normalizeApiError(profileQuery.error).message : null);

  return {
    profile: profileQuery.profile,
    status: {
      errorMessage,
      isLoading: profileQuery.isLoading,
      isRefetching: profileQuery.isRefetching && !profileQuery.isLoading,
      isSaving:
        profileQuery.isSavingFitness ||
        profileQuery.isSavingProfile,
      isRefreshingPhotos:
        photos.isEditingPhotos ||
        profileQuery.isUploadingPhoto ||
        profileQuery.isUpdatingPhoto ||
        profileQuery.isDeletingPhoto,
      queryError: profileQuery.error,
    },
    completeness: {
      score: completenessScore,
      missing: completenessMissing,
    },
    editor: {
      ...editor,
      knownLocationSuggestions,
      onPrimaryAction: () => {
        void editor.save();
      },
    },
    photos: {
      operation: photos.photoOperation,
      onDeletePhoto: (photoId: string) => {
        void photos.removePhoto(photoId);
      },
      onMakePrimaryPhoto: (photoId: string) => {
        void photos.makePrimaryPhoto(photoId);
      },
      onMovePhotoLeft: (photoId: string) => {
        void photos.movePhotoLeft(photoId);
      },
      onMovePhotoRight: (photoId: string) => {
        void photos.movePhotoRight(photoId);
      },
      onUploadPhoto: () => {
        void photos.uploadPhoto();
      },
    },
    settings: {
      ...settings,
    },
    account: {
      deletingAccount,
      onConfirmDeleteAccount: () => {
        if (deletingAccount) return;

        Alert.alert(
          'Delete account?',
          'This permanently removes your profile, matches, messages, event RSVPs, and saved session.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete account',
              style: 'destructive',
              onPress: async () => {
                setDeletingAccount(true);
                editor.setError(null);
                try {
                  await deleteAccount();
                } catch (err) {
                  void triggerErrorHaptic();
                  editor.setError(normalizeApiError(err).message);
                } finally {
                  setDeletingAccount(false);
                }
              },
            },
          ],
        );
      },
      onLogout: () => {
        void logout();
      },
    },
    actions: {
      onRefresh: () => {
        void profileQuery.refetch();
      },
    },
  };
}
