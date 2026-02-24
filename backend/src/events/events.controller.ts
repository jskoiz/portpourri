import {
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
  detail(@Param('id') id: string) {
    return this.eventsService.detail(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/rsvp')
  rsvp(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.rsvp(id, req.user.id);
  }
}
