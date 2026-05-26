import { WorkspaceConstraints } from '@common/validation';
import { WorkspaceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @MinLength(WorkspaceConstraints.NAME_MIN)
  @MaxLength(WorkspaceConstraints.NAME_MAX)
  declare name?: string;

  @IsOptional()
  @IsEnum(WorkspaceType)
  declare type?: WorkspaceType;
}
