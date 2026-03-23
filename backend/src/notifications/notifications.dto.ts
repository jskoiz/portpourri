import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotificationType } from '../common/enums';

export class EmitNotificationDto {
  @IsEnum(NotificationType, {
    message: `type must be one of: ${Object.values(NotificationType).join(', ')}`,
  })
  type!: NotificationType;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  matches?: boolean;

  @IsOptional()
  @IsBoolean()
  messages?: boolean;

  @IsOptional()
  @IsBoolean()
  likes?: boolean;

  @IsOptional()
  @IsBoolean()
  eventReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  eventRsvps?: boolean;

  @IsOptional()
  @IsBoolean()
  system?: boolean;
}
