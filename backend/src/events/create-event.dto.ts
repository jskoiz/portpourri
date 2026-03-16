import { IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  startsAt: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}
