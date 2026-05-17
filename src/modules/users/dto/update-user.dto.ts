import { UserConstraints } from '@common/validation';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(UserConstraints.NAME_MIN)
  @MaxLength(UserConstraints.NAME_MAX)
  declare firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(UserConstraints.NAME_MIN)
  @MaxLength(UserConstraints.NAME_MAX)
  declare lastName?: string;
}
