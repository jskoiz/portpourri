import { IsEnum, IsOptional, IsString } from 'class-validator';
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
  description?: string;

  @IsOptional()
  @IsString()
  matchId?: string;
}

export class BlockUserDto {
  @IsString()
  targetUserId: string;
}
