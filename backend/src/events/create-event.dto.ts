import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventCategory } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @MaxLength(300)
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
