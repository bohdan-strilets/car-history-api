import { UserConstraints } from '@common/validation';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class BaseUserDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  @MaxLength(UserConstraints.EMAIL_MAX)
  declare email: string;

  @IsString()
  @MinLength(UserConstraints.NAME_MIN)
  @MaxLength(UserConstraints.NAME_MAX)
  declare firstName: string;

  @IsString()
  @MinLength(UserConstraints.NAME_MIN)
  @MaxLength(UserConstraints.NAME_MAX)
  declare lastName: string;
}
