import { Controller, Get, Post, UseGuards, Request, Param, Query } from '@nestjs/common';
import { DiscoveryService, type DiscoveryFilters } from './discovery.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

type DiscoveryFeedQuery = {
  distanceKm?: string | string[];
  minAge?: string | string[];
  maxAge?: string | string[];
  goals?: string | string[];
  intensity?: string | string[];
  availability?: string | string[];
};

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
): DiscoveryFilters['availability'] | undefined => {
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
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('feed')
  async getFeed(
    @Request() req: AuthenticatedRequest,
    @Query() query: DiscoveryFeedQuery,
  ) {
    return this.discoveryService.getFeed(
      req.user.id,
      buildDiscoveryFilters(query),
    );
  }

  @Post('like/:id')
  async likeUser(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.discoveryService.likeUser(req.user.id, id);
  }

  @Post('pass/:id')
  async passUser(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.discoveryService.passUser(req.user.id, id);
  }

  @Post('undo')
  async undoLastSwipe(@Request() req: AuthenticatedRequest) {
    return this.discoveryService.undoLastSwipe(req.user.id);
  }

  @Get('profile-completeness')
  async getProfileCompleteness(@Request() req: AuthenticatedRequest) {
    return this.discoveryService.getProfileCompleteness(req.user.id);
  }
}
