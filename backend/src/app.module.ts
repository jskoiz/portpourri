import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './profile/profile.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { MatchesModule } from './matches/matches.module';
import { EventsModule } from './events/events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ModerationModule } from './moderation/moderation.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ProfileModule,
    DiscoveryModule,
    MatchesModule,
    EventsModule,
    NotificationsModule,
    ModerationModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
