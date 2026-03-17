import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchesRealtimeService } from './matches-realtime.service';
import { ChatGateway } from './chat.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [MatchesController],
  providers: [
    MatchesService,
    MatchesRealtimeService,
    ChatGateway,
    {
      provide: 'ChatGateway',
      useExisting: ChatGateway,
    },
  ],
})
export class MatchesModule {}
