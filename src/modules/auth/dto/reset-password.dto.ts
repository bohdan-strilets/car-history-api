import { UserConstraints } from '@common/validation';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  declare token: string;

  @IsString()
  @MinLength(UserConstraints.PASSWORD_MIN)
  @MaxLength(UserConstraints.PASSWORD_MAX)
  declare password: string;
}
