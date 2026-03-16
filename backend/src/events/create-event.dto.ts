import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventCategory } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsEnum(EventCategory, {
    message: `category must be one of: ${Object.values(EventCategory).join(', ')}`,
  })
  category?: EventCategory;

  @IsString()
  startsAt: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}
