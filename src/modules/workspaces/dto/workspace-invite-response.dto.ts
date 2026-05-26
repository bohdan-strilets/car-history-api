import { InviteStatus, Role } from '@prisma/client';

export class WorkspaceInviteResponseDto {
  declare id: string;
  declare workspaceId: string;
  declare invitedById: string;
  declare email: string;
  declare role: Role;
  declare status: InviteStatus;
  declare expiresAt: Date;
  declare createdAt: Date;
}
