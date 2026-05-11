import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
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

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  declare password: string;
}
