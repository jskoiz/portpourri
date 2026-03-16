import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Param,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { MatchesService } from './matches.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../common/auth-request.interface';
import { SendMessageDto } from './matches.dto';

@Controller('matches')
@UseGuards(AuthGuard('jwt'))
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async getMatches(@Request() req: AuthenticatedRequest) {
    return this.matchesService.getMatches(req.user.id);
  }

  @Get(':id/messages')
  async getMessages(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.matchesService.getMessages(id, req.user.id);
  }

  @Sse(':id/messages/stream')
  async streamMessages(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Observable<MessageEvent>> {
    return this.matchesService.streamMessages(id, req.user.id);
  }

  @Post(':id/messages')
  async sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    return this.matchesService.sendMessage(id, req.user.id, body.content);
  }
}
