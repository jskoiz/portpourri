import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { appConfig } from '../config/app.config';
import { AuthenticatedUserService } from './authenticated-user.service';
import { TokenAuthService } from './token-auth.service';
import { OAuthService } from './oauth.service';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    JwtModule.register({
      secret: appConfig.jwt.secret,
      signOptions: { expiresIn: appConfig.jwt.expiresIn },
    }),
  ],
  providers: [
    AuthService,
    OAuthService,
    JwtStrategy,
    AuthenticatedUserService,
    TokenAuthService,
  ],
  controllers: [AuthController],
  exports: [AuthenticatedUserService, TokenAuthService, JwtModule],
})
export class AuthModule {}
