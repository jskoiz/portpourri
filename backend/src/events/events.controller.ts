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

@Controller('events')
@ApiTags('Events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List public events' })
  @ApiOkResponse({ description: 'Events returned successfully.' })
  list(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.eventsService.list(
      undefined,
      take ? Math.min(parseInt(take, 10), 100) : 20,
      skip ? parseInt(skip, 10) : 0,
    );
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
    return this.eventsService.myEvents(
      req.user.id,
      take ? parseInt(take, 10) : 20,
      skip ? parseInt(skip, 10) : 0,
    );
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
}
