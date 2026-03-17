import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { CreateEventDto } from './create-event.dto';
import { InviteEventDto } from './invite-event.dto';

@Controller('events')
@ApiTags('Events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List public events' })
  @ApiOkResponse({ description: 'Events returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  list(
    @Request() req: AuthenticatedRequest,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const parsedTake = parseInt(take ?? '', 10);
    const parsedSkip = parseInt(skip ?? '', 10);
    const safeTake = Number.isNaN(parsedTake) ? 20 : Math.min(Math.max(parsedTake, 1), 100);
    const safeSkip = Number.isNaN(parsedSkip) ? 0 : Math.max(parsedSkip, 0);
    return this.eventsService.list(req.user.id, safeTake, safeSkip);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List events created by the current user' })
  @ApiOkResponse({ description: 'Current user events returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  myEvents(
    @Request() req: AuthenticatedRequest,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const parsedTake = parseInt(take ?? '', 10);
    const parsedSkip = parseInt(skip ?? '', 10);
    const safeTake = Number.isNaN(parsedTake) ? 20 : Math.min(Math.max(parsedTake, 1), 100);
    const safeSkip = Number.isNaN(parsedSkip) ? 0 : Math.max(parsedSkip, 0);
    return this.eventsService.myEvents(req.user.id, safeTake, safeSkip);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event details for the current user' })
  @ApiOkResponse({ description: 'Event details returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  detail(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.detail(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiCreatedResponse({ description: 'Event created successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  create(
    @Body() payload: CreateEventDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.eventsService.create(payload, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/rsvp')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'RSVP to an event' })
  @ApiCreatedResponse({ description: 'RSVP recorded successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  rsvp(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.rsvp(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/invite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite a match to an event' })
  @ApiCreatedResponse({ description: 'Invite sent successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  invite(
    @Param('id') id: string,
    @Body() payload: InviteEventDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.eventsService.invite(
      id,
      req.user.id,
      payload.matchId,
      payload.message,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/invites')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List invites for an event (host only)' })
  @ApiOkResponse({ description: 'Event invites returned successfully.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getInvites(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.eventsService.getInvites(id, req.user.id);
  }
}
