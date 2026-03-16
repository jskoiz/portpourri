import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IntensityLevel } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  intentDating?: boolean;

  @IsOptional()
  @IsBoolean()
  intentWorkout?: boolean;

  @IsOptional()
  @IsBoolean()
  intentFriends?: boolean;
}

export class UpdateFitnessProfileDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(IntensityLevel, {
    message: `intensityLevel must be one of: ${Object.values(IntensityLevel).join(', ')}`,
  })
  intensityLevel?: IntensityLevel;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  weeklyFrequencyBand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  primaryGoal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  secondaryGoal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  favoriteActivities?: string;

  @IsOptional()
  @IsBoolean()
  prefersMorning?: boolean;

  @IsOptional()
  @IsBoolean()
  prefersEvening?: boolean;
}

export class UpdatePhotoDto {
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
