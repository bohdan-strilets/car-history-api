import { WorkspaceConstraints } from '@common/validation';
import { Role, WorkspaceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Create and Update DTOs

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(WorkspaceConstraints.NAME_MIN)
  @MaxLength(WorkspaceConstraints.NAME_MAX)
  declare name: string;

  @IsEnum(WorkspaceType)
  declare type: WorkspaceType;
}

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

// Response DTOs

export class WorkspaceUserDto {
  declare id: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare avatarUrl: string | null;
}

export class WorkspaceInfoResponseDto {
  declare id: string;
  declare name: string;
  declare type: WorkspaceType;
}
export class WorkspaceResponseDto {
  declare id: string;
  declare ownerId: string;
  declare name: string;
  declare type: WorkspaceType;
  declare role: Role;
  declare membersCount: number;
  declare vehiclesCount: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class WorkspaceWithOwnerResponseDto extends WorkspaceResponseDto {
  declare owner: WorkspaceUserDto;
}

export class WorkspaceIdDto {
  declare id: string;
}
