import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportCategory } from '@prisma/client';

export class ReportUserDto {
  @IsString()
  reportedUserId: string;

  @IsEnum(ReportCategory, {
    message: `category must be one of: ${Object.values(ReportCategory).join(', ')}`,
  })
  category: ReportCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  matchId?: string;
}

export class BlockUserDto {
  @IsString()
  targetUserId: string;
}
