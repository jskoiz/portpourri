import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VerificationChannel } from '../common/enums';

export class StartVerificationDto {
  @IsEnum(VerificationChannel)
  channel: VerificationChannel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  target: string;
}

export class ConfirmVerificationDto {
  @IsEnum(VerificationChannel)
  channel: VerificationChannel;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}
