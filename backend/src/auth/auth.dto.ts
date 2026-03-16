import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { Gender } from '../common/enums';

const ALLOWED_GENDERS = Object.values(Gender);

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  birthdate: string;

  @IsIn(ALLOWED_GENDERS, {
    message: `Gender must be one of: ${ALLOWED_GENDERS.join(', ')}`,
  })
  gender: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
