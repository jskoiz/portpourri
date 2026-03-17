import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PhotoStorageService } from './photo-storage.service';

@Module({
  providers: [ProfileService, PhotoStorageService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}
