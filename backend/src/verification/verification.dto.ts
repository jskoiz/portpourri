import { IsEnum, IsString, MaxLength } from 'class-validator';
import { VerificationChannel } from '../common/enums';

export class StartVerificationDto {
  @IsEnum(VerificationChannel)
  channel: VerificationChannel;

  @IsString()
  @MaxLength(254)
  target: string;
}

export class ConfirmVerificationDto {
  @IsEnum(VerificationChannel)
  channel: VerificationChannel;

  @IsString()
  @MaxLength(10)
  code: string;
}
