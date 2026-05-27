import { Role, WorkspaceType } from '@prisma/client';

export class WorkspaceResponseDto {
  declare id: string;
  declare ownerId: string;
  declare name: string;
  declare type: WorkspaceType;
  declare role: Role;
  declare membersCount: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}
