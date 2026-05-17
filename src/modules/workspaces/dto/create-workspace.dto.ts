import { WorkspaceConstraints } from '@common/validation';
import { WorkspaceType } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(WorkspaceConstraints.NAME_MIN)
  @MaxLength(WorkspaceConstraints.NAME_MAX)
  declare name: string;

  @IsEnum(WorkspaceType)
  declare type: WorkspaceType;
}
