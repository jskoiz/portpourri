import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  NotificationsService,
  NotificationType,
} from './notifications.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { EmitNotificationDto } from './notifications.dto';

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
@ApiTags('Notifications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication is required.' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiOkResponse({ description: 'Notifications returned successfully.' })
  async list(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.list(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiOkResponse({ description: 'Notification marked as read.' })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  async markRead(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const result = await this.notificationsService.markRead(req.user.id, id);
    if (result === null) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return result;
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiCreatedResponse({ description: 'All notifications marked as read.' })
  async markAllRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  // Seed endpoint for QA and future admin tooling
  @Post('emit')
  @ApiOperation({ summary: 'Emit a notification for the current user' })
  @ApiCreatedResponse({ description: 'Notification emitted successfully.' })
  async emit(
    @Request() req: AuthenticatedRequest,
    @Body() body: EmitNotificationDto,
  ) {
    return this.notificationsService.create(req.user.id, {
      type: toNotificationType(body.type),
      title: body.title,
      body: body.body,
      data: body.data,
    });
  }
}
