import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
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
import { NotificationsService } from './notifications.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { EmitNotificationDto } from './notifications.dto';
import { appConfig } from '../config/app.config';

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
  async list(
    @Request() req: AuthenticatedRequest,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedTake = take ? Number.parseInt(take, 10) : NaN;
    return this.notificationsService.list(
      req.user.id,
      Number.isNaN(parsedTake) ? 50 : Math.min(parsedTake, 100),
      cursor || undefined,
    );
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
