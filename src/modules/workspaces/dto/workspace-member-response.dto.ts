import { Role } from '@prisma/client';

export class WorkspaceMemberResponseDto {
  declare id: string;
  declare workspaceId: string;
  declare userId: string;
  declare role: Role;
  declare createdAt: Date;
  declare updatedAt: Date;
}
