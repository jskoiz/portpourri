import { IsEnum, IsString } from 'class-validator';
import { VerificationChannel } from '../common/enums';

export class StartVerificationDto {
  @IsEnum(VerificationChannel)
  channel: VerificationChannel;

  @IsString()
  target: string;
}

export class ConfirmVerificationDto {
  @IsEnum(VerificationChannel)
  channel: VerificationChannel;

  @IsString()
  code: string;
}
