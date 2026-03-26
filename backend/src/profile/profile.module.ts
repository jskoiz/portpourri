import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PhotoStorageService } from './photo-storage.service';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [ModerationModule],
  providers: [ProfileService, PhotoStorageService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}
