import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('matches')
@UseGuards(AuthGuard('jwt'))
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) { }

    @Post('like')
    async likeUser(@Request() req, @Body() body: { toUserId: string }) {
        return this.matchesService.likeUser(req.user.id, body.toUserId);
    }

    @Get()
    async getMatches(@Request() req) {
        return this.matchesService.getMatches(req.user.id);
    }
    @Get(':id/messages')
    async getMessages(@Request() req, @Param('id') id: string) {
        return this.matchesService.getMessages(id, req.user.id);
    }

    @Post(':id/messages')
    async sendMessage(@Request() req, @Param('id') id: string, @Body() body: { content: string }) {
        return this.matchesService.sendMessage(id, req.user.id, body.content);
    }
}
