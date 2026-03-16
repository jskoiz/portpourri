import {
  Body,
  Controller,
  Get,
  Post,
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
import { VerificationService } from './verification.service';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import {
  StartVerificationDto,
  ConfirmVerificationDto,
} from './verification.dto';

@Controller('verification')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Verification')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication is required.' })
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Return the verification status for the current user',
  })
  @ApiOkResponse({ description: 'Verification status returned successfully.' })
  status(@Request() req: AuthenticatedRequest) {
    return this.verificationService.status(req.user.id);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start a verification challenge' })
  @ApiCreatedResponse({
    description: 'Verification challenge started successfully.',
  })
  start(
    @Request() req: AuthenticatedRequest,
    @Body() body: StartVerificationDto,
  ) {
    return this.verificationService.start(
      req.user.id,
      body.channel,
      body.target,
    );
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a verification challenge' })
  @ApiCreatedResponse({
    description: 'Verification challenge confirmed successfully.',
  })
  confirm(
    @Request() req: AuthenticatedRequest,
    @Body() body: ConfirmVerificationDto,
  ) {
    return this.verificationService.confirm(
      req.user.id,
      body.channel,
      body.code,
    );
  }
}
