import client from '../../api/client';
import type {
  UpdateFitnessPayload,
  UpdatePhotoPayload,
  UpdateProfilePayload,
  User,
  UserPhoto,
  UserProfile,
  UploadPhotoPayload,
} from '../../api/types';
import { normalizeIntensityLevelForApi } from '../../api/profileIntensity';
import { withErrorLogging } from './shared';

type ReactNativeFormDataFile = {
  uri: string;
  name?: string;
  type?: string;
};

type ReactNativeFormData = FormData & {
  append(name: string, value: ReactNativeFormDataFile): void;
};

type UserProfileRecord = UserProfile & { userId: string };

export const profileApi = {
  getProfile: async () =>
    withErrorLogging('profile', 'getProfile', () =>
      client.get<User>('/profile'),
    ),
  updateFitness: async (payload: UpdateFitnessPayload) =>
    withErrorLogging('profile', 'updateFitness', () =>
      client.patch<User>('/profile/fitness', {
        ...payload,
        intensityLevel: normalizeIntensityLevelForApi(payload.intensityLevel),
      }),
    ),
  updateProfile: async (payload: UpdateProfilePayload) =>
    withErrorLogging('profile', 'updateProfile', () =>
      client.patch<UserProfileRecord>('/profile', payload),
    ),
  uploadPhoto: async (payload: UploadPhotoPayload) => {
    const formData = new FormData() as ReactNativeFormData;
    const file: ReactNativeFormDataFile = {
      uri: payload.uri,
      name: payload.fileName ?? `profile-${Date.now()}.jpg`,
      type: payload.mimeType ?? 'image/jpeg',
    };
    formData.append('file', file);

    return withErrorLogging('profile', 'uploadPhoto', () =>
      client.post<UserPhoto>('/profile/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (!payload.onProgress || !event.total) return;
          payload.onProgress(
            Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100))),
          );
        },
      }),
    );
  },
  updatePhoto: async (photoId: string, payload: UpdatePhotoPayload) =>
    withErrorLogging('profile', 'updatePhoto', () =>
      client.patch<UserPhoto | null>(`/profile/photos/${photoId}`, payload),
      { photoId },
    ),
  deletePhoto: async (photoId: string) =>
    withErrorLogging('profile', 'deletePhoto', () =>
      client.delete<UserPhoto | null>(`/profile/photos/${photoId}`),
      { photoId },
    ),
};
