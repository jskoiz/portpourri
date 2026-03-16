import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Patch,
  Body,
  UseGuards,
  Request,
  Param,
  NotFoundException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UpdateFitnessProfileDto, UpdatePhotoDto, UpdateProfileDto } from './profile.dto';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Request() req: AuthenticatedRequest) {
    const profile = await this.profileService.getProfile(req.user.id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  @Get(':id')
  async getProfileById(@Param('id') id: string) {
    const profile = await this.profileService.getProfile(id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  @Put()
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() data: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(req.user.id, data);
  }

  @Put('fitness')
  async updateFitnessProfile(
    @Request() req: AuthenticatedRequest,
    @Body() data: UpdateFitnessProfileDto,
  ) {
    return this.profileService.updateFitnessProfile(req.user.id, data);
  }

  @Post('photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Photo file is required');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Unsupported photo type');
    }

    return this.profileService.uploadPhoto(req.user.id, file);
  }

  @Patch('photos/:id')
  async updatePhoto(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdatePhotoDto,
  ) {
    return this.profileService.updatePhoto(req.user.id, id, data);
  }

  @Delete('photos/:id')
  async deletePhoto(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.profileService.deletePhoto(req.user.id, id);
  }
}
