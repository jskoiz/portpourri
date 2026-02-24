import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

@Module({
  imports: [PrismaModule],
  providers: [VerificationService],
  controllers: [VerificationController],
})
export class VerificationModule {}
