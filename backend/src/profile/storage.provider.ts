import { appConfig } from '../config/app.config';
import { PhotoStorageService } from './photo-storage.service';
import { R2StorageService } from './r2-storage.service';

export const PHOTO_STORAGE = Symbol('PHOTO_STORAGE');

export const photoStorageProvider = {
  provide: PHOTO_STORAGE,
  useFactory: (local: PhotoStorageService, r2: R2StorageService) => {
    return appConfig.storage.provider === 'r2' ? r2 : local;
  },
  inject: [PhotoStorageService, R2StorageService],
};
