import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VerificationService } from './verification.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';

@Controller('verification')
@UseGuards(AuthGuard('jwt'))
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('status')
  status(@Request() req: AuthenticatedRequest) {
    return this.verificationService.status(req.user.id);
  }

  @Post('start')
  start(
    @Request() req: AuthenticatedRequest,
    @Body() body: { channel: 'email' | 'phone'; target: string },
  ) {
    return this.verificationService.start(
      req.user.id,
      body.channel,
      body.target,
    );
  }

  @Post('confirm')
  confirm(
    @Request() req: AuthenticatedRequest,
    @Body() body: { channel: 'email' | 'phone'; code: string },
  ) {
    return this.verificationService.confirm(
      req.user.id,
      body.channel,
      body.code,
    );
  }
}
