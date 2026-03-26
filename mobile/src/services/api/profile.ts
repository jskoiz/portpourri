import client from '../../api/client';
import type {
  CurrentUser,
  UpdateFitnessPayload,
  UpdatePhotoPayload,
  UpdateProfilePayload,
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

function getChangedFields(payload: object): string[] {
  return Object.entries(payload)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key)
    .sort();
}

export const profileApi = {
  getProfile: async () =>
    withErrorLogging('profile', 'getProfile', () =>
      client.get<CurrentUser>('/profile'),
    ),
  getPublicProfile: async (userId: string) =>
    withErrorLogging('profile', 'getPublicProfile', () =>
      client.get<CurrentUser>(`/profile/${userId}`),
    ),
  updateFitness: async (payload: UpdateFitnessPayload) =>
    withErrorLogging('profile', 'updateFitness', () =>
      client.patch<CurrentUser>('/profile/fitness', {
        ...payload,
        intensityLevel: normalizeIntensityLevelForApi(payload.intensityLevel),
      }),
      {
        context: {
          changedFields: getChangedFields(payload),
          intensityLevel: normalizeIntensityLevelForApi(payload.intensityLevel),
        },
      },
    ),
  updateProfile: async (payload: UpdateProfilePayload) =>
    withErrorLogging('profile', 'updateProfile', () =>
      client.patch<UserProfileRecord>('/profile', payload),
      {
        context: {
          changedFields: getChangedFields(payload),
        },
      },
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
      {
        context: {
          fileType: file.type,
          hasCustomFileName: Boolean(payload.fileName),
          hasMimeType: Boolean(payload.mimeType),
        },
      },
    );
  },
  updatePhoto: async (photoId: string, payload: UpdatePhotoPayload) =>
    withErrorLogging('profile', 'updatePhoto', () =>
      client.patch<UserPhoto | null>(`/profile/photos/${photoId}`, payload),
      {
        context: {
          photoId,
          changedFields: getChangedFields(payload),
        },
      },
    ),
  deletePhoto: async (photoId: string) =>
    withErrorLogging('profile', 'deletePhoto', () =>
      client.delete<UserPhoto | null>(`/profile/photos/${photoId}`),
      { context: { photoId } },
    ),
};
