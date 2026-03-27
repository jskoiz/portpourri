import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PhotoStorageService } from './photo-storage.service';
import { R2StorageService } from './r2-storage.service';
import { photoStorageProvider } from './storage.provider';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [ModerationModule],
  providers: [
    ProfileService,
    PhotoStorageService,
    R2StorageService,
    photoStorageProvider,
  ],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}
