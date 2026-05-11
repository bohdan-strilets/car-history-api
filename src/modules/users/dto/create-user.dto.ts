import { UserConstraints } from '@common/validation';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { BaseUserDto } from './base-user.dto';

export class CreateUserDto extends BaseUserDto {
  @IsString()
  @MinLength(UserConstraints.PASSWORD_MIN)
  @MaxLength(UserConstraints.PASSWORD_MAX)
  declare password: string;
}
