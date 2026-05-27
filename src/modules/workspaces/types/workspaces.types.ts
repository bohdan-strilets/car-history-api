import {
  Currency,
  DateFormat,
  DistanceUnit,
  FuelUnit,
  Role,
  Workspace,
  WorkspaceType,
} from '@prisma/client';

export interface CreateWorkspaceInput {
  ownerId: string;
  name: string;
  type: WorkspaceType;
}

export interface CreateWorkspaceMemberInput {
  workspaceId: string;
  userId: string;
  role: Role;
}

export interface UpdateWorkspaceInput {
  name?: string;
  type?: WorkspaceType;
}

export interface UpdateWorkspaceSettingsInput {
  currency?: Currency;
  timezone?: string;
  distanceUnit?: DistanceUnit;
  fuelUnit?: FuelUnit;
  dateFormat?: DateFormat;
}

export interface WorkspaceOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export type WorkspaceWithOwner = Workspace & {
  owner: WorkspaceOwner;
  _count: { members: number };
};

export interface CreateWorkspaceInviteInput {
  workspaceId: string;
  invitedById: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: Date;
}

export type WorkspaceWithMeta = Workspace & {
  members: { role: Role }[];
  _count: { members: number };
};

export type WorkspaceId = { id: string };
