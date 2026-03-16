import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { Gender } from '../common/enums';

const ALLOWED_GENDERS = Object.values(Gender);

export class SignupDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(10)
  birthdate: string;

  @IsIn(ALLOWED_GENDERS, {
    message: `Gender must be one of: ${ALLOWED_GENDERS.join(', ')}`,
  })
  gender: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(128)
  password: string;
}
