import { UserConstraints } from '@common/validation';
import { IsOptional, IsUrl, MaxLength } from 'class-validator';

import { BaseUserDto } from './base-user.dto';

export class CreateGoogleUserDto extends BaseUserDto {
  @IsOptional()
  @IsUrl()
  @MaxLength(UserConstraints.AVATAR_URL_MAX)
  declare avatarUrl?: string;
}
