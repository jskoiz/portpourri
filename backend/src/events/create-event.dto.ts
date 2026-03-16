import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EventCategory } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(300)
  location: string;

  @IsOptional()
  @IsEnum(EventCategory, {
    message: `category must be one of: ${Object.values(EventCategory).join(', ')}`,
  })
  category?: EventCategory;

  @IsString()
  @IsNotEmpty()
  startsAt: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}
