import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  declare email: string;

  @IsOptional()
  @IsEnum(Role)
  declare role?: Role;
}
