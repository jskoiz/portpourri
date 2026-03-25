import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
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
import { appConfig } from '../config/app.config';
import { parseTake } from '../common/pagination.util';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { EmitNotificationDto, UpdateNotificationPreferencesDto } from './notifications.dto';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Notifications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication is required.' })
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiOkResponse({ description: 'Notifications returned successfully.' })
  async list(
    @Request() req: AuthenticatedRequest,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.notificationsService.list(
      req.user.id,
      parseTake(take, 50),
      cursor || undefined,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Return the unread notification count' })
  @ApiOkResponse({ description: 'Unread count returned successfully.' })
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for the current user' })
  @ApiOkResponse({ description: 'Notification preferences returned.' })
  async getPreferences(@Request() req: AuthenticatedRequest) {
    return this.preferencesService.get(req.user.id);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences for the current user' })
  @ApiOkResponse({ description: 'Notification preferences updated.' })
  async updatePreferences(
    @Request() req: AuthenticatedRequest,
    @Body() body: UpdateNotificationPreferencesDto,
  ) {
    return this.preferencesService.upsert(req.user.id, body);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiOkResponse({ description: 'Notification marked as read.' })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  async markRead(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(req.user.id, id);
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({ description: 'All notifications marked as read.' })
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
    if (appConfig.isProduction) {
      throw new ForbiddenException('Endpoint disabled in production');
    }
    return this.notificationsService.create(req.user.id, {
      type: body.type,
      title: body.title,
      body: body.body,
      data: body.data,
    });
  }
}
