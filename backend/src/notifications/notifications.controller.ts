import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  NotificationsService,
  NotificationType,
} from './notifications.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

const VALID_TYPES = new Set<NotificationType>([
  'like_received',
  'match_created',
  'message_received',
  'event_rsvp',
  'event_reminder',
  'system',
]);

function toNotificationType(raw: string): NotificationType {
  return VALID_TYPES.has(raw as NotificationType)
    ? (raw as NotificationType)
    : 'system';
}

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.list(req.user.id);
  }

  @Patch(':id/read')
  markRead(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.id, id);
  }

  @Post('mark-all-read')
  markAllRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  // Seed endpoint for QA and future admin tooling
  @Post('emit')
  emit(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: {
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    return this.notificationsService.create(req.user.id, {
      type: toNotificationType(body.type),
      title: body.title,
      body: body.body,
      data: body.data,
    });
  }
}
