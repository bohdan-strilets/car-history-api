import { UserConstraints } from '@common/validation';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  @MaxLength(UserConstraints.EMAIL_MAX)
  declare email: string;
}
