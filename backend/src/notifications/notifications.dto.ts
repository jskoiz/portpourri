import { IsObject, IsOptional, IsString } from 'class-validator';

export class EmitNotificationDto {
  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
