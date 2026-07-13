import { UserConstraints } from '@common/validation';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  declare currentPassword: string;

  @IsString()
  @MinLength(UserConstraints.PASSWORD_MIN)
  @MaxLength(UserConstraints.PASSWORD_MAX)
  declare newPassword: string;
}
