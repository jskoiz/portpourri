import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ModerationService } from './moderation.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

@Controller('moderation')
@UseGuards(AuthGuard('jwt'))
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('report')
  report(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      reportedUserId: string;
      category: string;
      description?: string;
      matchId?: string;
    },
  ) {
    return this.moderationService.reportUser(req.user.id, body);
  }

  @Post('block')
  block(
    @Req() req: AuthenticatedRequest,
    @Body() body: { targetUserId: string },
  ) {
    return this.moderationService.blockUser(req.user.id, body.targetUserId);
  }
}
