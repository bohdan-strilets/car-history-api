import { WorkspaceType } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  declare name: string;

  @IsEnum(WorkspaceType)
  declare type: WorkspaceType;
}
