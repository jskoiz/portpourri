import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { ReportUserDto, BlockUserDto } from './moderation.dto';

@Controller('moderation')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Moderation')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication is required.' })
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('report')
  @ApiOperation({ summary: 'Report another user for moderation review' })
  @ApiCreatedResponse({ description: 'User report submitted successfully.' })
  report(@Req() req: AuthenticatedRequest, @Body() body: ReportUserDto) {
    return this.moderationService.reportUser(req.user.id, body);
  }

  @Post('block')
  @ApiOperation({ summary: 'Block another user' })
  @ApiCreatedResponse({ description: 'User blocked successfully.' })
  block(@Req() req: AuthenticatedRequest, @Body() body: BlockUserDto) {
    return this.moderationService.blockUser(req.user.id, body.targetUserId);
  }
}
