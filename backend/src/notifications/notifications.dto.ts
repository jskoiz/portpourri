import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class EmitNotificationDto {
  @IsString()
  @MaxLength(50)
  type: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(1000)
  body: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
