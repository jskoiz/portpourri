import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EventsService } from './events.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { CreateEventDto } from './create-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list() {
    return this.eventsService.list();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  myEvents(@Request() req: AuthenticatedRequest) {
    return this.eventsService.myEvents(req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  detail(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.detail(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @Body() payload: CreateEventDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.eventsService.create(payload, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/rsvp')
  rsvp(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.rsvp(id, req.user.id);
  }
}
