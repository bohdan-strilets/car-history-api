import { InviteStatus, Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

import { WorkspaceInfoResponseDto, WorkspaceUserDto } from './workspace.dto';

// Create and Update DTOs

export class CreateInviteDto {
  @IsEmail()
  declare email: string;

  @IsOptional()
  @IsEnum(Role)
  declare role?: Role;
}

export class UpdateMemberRoleDto {
  @IsEnum(Role)
  declare role: Role;
}

// Response DTOs

export class WorkspaceMemberWithUserResponseDto {
  declare id: string;
  declare workspaceId: string;
  declare userId: string;
  declare role: Role;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare user: WorkspaceUserDto;
}

export class WorkspaceInviteResponseDto {
  declare id: string;
  declare workspaceId: string;
  declare invitedById: string;
  declare email: string;
  declare role: Role;
  declare status: InviteStatus;
  declare workspace: WorkspaceInfoResponseDto;
  declare expiresAt: Date;
  declare createdAt: Date;
}
