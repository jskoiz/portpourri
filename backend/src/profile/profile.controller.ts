import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
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
import {
  ApiBody,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  UpdateFitnessProfileDto,
  UpdatePhotoDto,
  UpdateProfileDto,
} from './profile.dto';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Profile')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication is required.' })
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Return the current user profile' })
  @ApiOkResponse({ description: 'Profile returned successfully.' })
  @ApiNotFoundResponse({ description: 'Profile not found.' })
  async getProfile(@Request() req: AuthenticatedRequest) {
    const profile = await this.profileService.getProfile(req.user.id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Return a profile by user identifier' })
  @ApiOkResponse({ description: 'Profile returned successfully.' })
  @ApiNotFoundResponse({ description: 'Profile not found.' })
  async getProfileById(@Param('id') id: string) {
    const profile = await this.profileService.getProfile(id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Strip sensitive / internal fields from public profile responses
    const {
      isDeleted: _del,
      isBanned: _ban,
      email: _email,
      ...safeProfile
    } = profile;

    // Strip coordinates from nested profile if present
    if (safeProfile.profile) {
      const { latitude: _lat, longitude: _lon, ...safeNestedProfile } = safeProfile.profile;
      return { ...safeProfile, profile: safeNestedProfile };
    }

    return safeProfile;
  }

  @Patch()
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiOkResponse({ description: 'Profile updated successfully.' })
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() data: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(req.user.id, data);
  }

  @Patch('fitness')
  @ApiOperation({ summary: 'Update the current user fitness profile' })
  @ApiOkResponse({ description: 'Fitness profile updated successfully.' })
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a new profile photo' })
  @ApiCreatedResponse({ description: 'Photo uploaded successfully.' })
  @ApiBadRequestResponse({ description: 'Photo file is missing or invalid.' })
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
  @ApiOperation({ summary: 'Update profile photo metadata' })
  @ApiOkResponse({ description: 'Photo updated successfully.' })
  async updatePhoto(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdatePhotoDto,
  ) {
    const result = await this.profileService.updatePhoto(req.user.id, id, data);
    if (!result) {
      throw new NotFoundException('Photo not found');
    }
    return result;
  }

  @Delete('photos/:id')
  @ApiOperation({ summary: 'Delete a profile photo' })
  @ApiOkResponse({ description: 'Photo deleted successfully.' })
  async deletePhoto(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const result = await this.profileService.deletePhoto(req.user.id, id);
    if (!result) {
      throw new NotFoundException('Photo not found');
    }
    return result;
  }
}
