import { IsOptional, IsString } from 'class-validator';

export class ReportUserDto {
  @IsString()
  reportedUserId: string;

  @IsString()
  category: string;

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
