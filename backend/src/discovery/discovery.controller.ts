import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DiscoveryService, type DiscoveryFilters } from './discovery.service';
import { ProfileService } from '../profile/profile.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { IsOptional, IsString } from 'class-validator';

class DiscoveryFeedQuery {
  @IsOptional()
  @IsString()
  distanceKm?: string;

  @IsOptional()
  @IsString()
  minAge?: string;

  @IsOptional()
  @IsString()
  maxAge?: string;

  @IsOptional()
  @IsString()
  goals?: string;

  @IsOptional()
  @IsString()
  intensity?: string;

  @IsOptional()
  @IsString()
  availability?: string;
}

const parseNumber = (value?: string | string[]): number | undefined => {
  const candidates = Array.isArray(value) ? value : value ? [value] : [];

  for (const candidate of candidates) {
    if (!candidate.trim()) continue;

    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const parseList = (value?: string | string[]): string[] | undefined => {
  const parts = Array.isArray(value) ? value : value ? [value] : [];
  const items = parts
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

  return items?.length ? items : undefined;
};

const parseAvailability = (
  value?: string | string[],
): NonNullable<DiscoveryFilters['availability']> | undefined => {
  const items = parseList(value)?.filter(
    (entry): entry is NonNullable<DiscoveryFilters['availability']>[number] =>
      entry === 'morning' || entry === 'evening',
  );

  return items?.length ? items : undefined;
};

const buildDiscoveryFilters = (
  query: DiscoveryFeedQuery,
): DiscoveryFilters => ({
  distanceKm: parseNumber(query.distanceKm),
  minAge: parseNumber(query.minAge),
  maxAge: parseNumber(query.maxAge),
  goals: parseList(query.goals),
  intensity: parseList(query.intensity),
  availability: parseAvailability(query.availability),
});

@Controller('discovery')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Discovery')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication is required.' })
export class DiscoveryController {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly profileService: ProfileService,
  ) {}

  @Get('feed')
  @ApiOperation({ summary: 'Return the discovery feed for the current user' })
  @ApiOkResponse({ description: 'Discovery feed returned successfully.' })
  async getFeed(
    @Request() req: AuthenticatedRequest,
    @Query() query: DiscoveryFeedQuery,
  ) {
    const filters = buildDiscoveryFilters(query);
    if (
      typeof filters.minAge === 'number' &&
      typeof filters.maxAge === 'number' &&
      filters.minAge > filters.maxAge
    ) {
      throw new BadRequestException(
        'minAge must be less than or equal to maxAge',
      );
    }

    return this.discoveryService.getFeed(
      req.user.id,
      filters,
    );
  }

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('like/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a discovery profile' })
  @ApiOkResponse({ description: 'Profile liked successfully.' })
  @ApiTooManyRequestsResponse({ description: 'Swipe rate limit exceeded.' })
  async likeUser(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.discoveryService.likeUser(req.user.id, id);
  }

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('pass/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pass on a discovery profile' })
  @ApiOkResponse({ description: 'Profile passed successfully.' })
  @ApiTooManyRequestsResponse({ description: 'Swipe rate limit exceeded.' })
  async passUser(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.discoveryService.passUser(req.user.id, id);
  }

  @Post('undo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Undo the most recent swipe action' })
  @ApiOkResponse({ description: 'Last swipe undone successfully.' })
  async undoLastSwipe(@Request() req: AuthenticatedRequest) {
    return this.discoveryService.undoLastSwipe(req.user.id);
  }

  @Get('profile-completeness')
  @ApiOperation({ summary: 'Return profile completeness for the current user' })
  @ApiOkResponse({ description: 'Profile completeness returned successfully.' })
  async getProfileCompleteness(@Request() req: AuthenticatedRequest) {
    return this.profileService.getProfileCompleteness(req.user.id);
  }
}
