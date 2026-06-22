import { UserConstraints } from '@common/validation';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  @MaxLength(UserConstraints.EMAIL_MAX)
  declare email: string;

  @IsString()
  @MinLength(UserConstraints.PASSWORD_MIN)
  @MaxLength(UserConstraints.PASSWORD_MAX)
  declare password: string;
}
