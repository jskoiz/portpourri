import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

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

  @Put('fitness')
  async updateFitnessProfile(
    @Request() req: AuthenticatedRequest,
    @Body() data: Record<string, unknown>,
  ) {
    return this.profileService.updateFitnessProfile(req.user.id, data);
  }
}
