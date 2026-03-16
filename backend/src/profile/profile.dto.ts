import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { IntensityLevel } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
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
  weeklyFrequencyBand?: string;

  @IsOptional()
  @IsString()
  primaryGoal?: string;

  @IsOptional()
  @IsString()
  secondaryGoal?: string;

  @IsOptional()
  @IsString()
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
