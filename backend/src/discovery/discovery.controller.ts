import { Controller, Get, Post, UseGuards, Request, Param } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('discovery')
@UseGuards(AuthGuard('jwt'))
export class DiscoveryController {
    constructor(private readonly discoveryService: DiscoveryService) { }

    @Get('feed')
    async getFeed(@Request() req) {
        return this.discoveryService.getFeed(req.user.id);
    }

    @Post('like/:id')
    async likeUser(@Request() req, @Param('id') id: string) {
        return this.discoveryService.likeUser(req.user.id, id);
    }

    @Post('pass/:id')
    async passUser(@Request() req, @Param('id') id: string) {
        return this.discoveryService.passUser(req.user.id, id);
    }
}
