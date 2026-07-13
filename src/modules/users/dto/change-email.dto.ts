import { UserConstraints } from '@common/validation';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class ChangeEmailDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  @MaxLength(UserConstraints.EMAIL_MAX)
  declare newEmail: string;
}
