import { IsOptional, IsString, MaxLength } from 'class-validator';

export class InviteEventDto {
  @IsString()
  matchId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
