import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { SendMessageDto } from './matches.dto';

@Controller('matches')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Matches')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Authentication is required.' })
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'List matches for the current user' })
  @ApiOkResponse({ description: 'Matches returned successfully.' })
  async getMatches(
    @Request() req: AuthenticatedRequest,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.matchesService.getMatches(
      req.user.id,
      take ? parseInt(take, 10) : undefined,
      skip ? parseInt(skip, 10) : undefined,
    );
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'List messages for a match' })
  @ApiOkResponse({ description: 'Match messages returned successfully.' })
  async getMessages(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.matchesService.getMessages(id, req.user.id);
  }

  @Sse(':id/messages/stream')
  @ApiOperation({
    summary: 'Stream server-sent events for a match conversation',
  })
  @ApiOkResponse({ description: 'Message event stream opened successfully.' })
  async streamMessages(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Observable<MessageEvent>> {
    return this.matchesService.streamMessages(id, req.user.id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a match conversation' })
  @ApiCreatedResponse({ description: 'Message sent successfully.' })
  async sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    return this.matchesService.sendMessage(id, req.user.id, body.content);
  }
}
