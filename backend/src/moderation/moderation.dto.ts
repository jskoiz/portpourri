import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ReportCategory } from '@prisma/client';

export class ReportUserDto {
  @IsString()
  @IsNotEmpty()
  reportedUserId!: string;

  @IsEnum(ReportCategory, {
    message: `category must be one of: ${Object.values(ReportCategory).join(', ')}`,
  })
  category!: ReportCategory;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  matchId?: string;
}

export class BlockUserDto {
  @Expose()
  @Transform(({ value, obj }) => {
    const candidate = value ?? obj?.blockedUserId;
    return typeof candidate === 'string' ? candidate.trim() : candidate;
  })
  @IsString()
  @IsNotEmpty()
  targetUserId!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  blockedUserId?: string;
}
