import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGoogleUserDto {
  @IsEmail()
  declare email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  declare firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  declare lastName: string;

  @IsOptional()
  @IsString()
  declare avatarUrl?: string;
}
