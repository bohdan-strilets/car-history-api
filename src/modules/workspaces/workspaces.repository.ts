import { Injectable } from '@nestjs/common';
import { Workspace } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { workspaceUserInfoSelect } from './selects';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceWithMeta,
  WorkspaceWithOwner,
} from './types';

@Injectable()
export class WorkspacesRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findById(workspaceId: string, tx?: PrismaTxClient): Promise<Workspace | null> {
    const client = tx ?? this.prisma;
    return client.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
    });
  }

  async findAllByUserId(userId: string): Promise<WorkspaceWithMeta[]> {
    return this.prisma.workspace.findMany({
      where: {
        deletedAt: null,
        members: { some: { userId } },
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
        _count: { select: { members: true, vehicles: true } },
      },
    });
  }

  async create(input: CreateWorkspaceInput, tx?: PrismaTxClient): Promise<Workspace> {
    const client = tx ?? this.prisma;
    return client.workspace.create({ data: input });
  }

  async findByIdWithOwner(workspaceId: string): Promise<WorkspaceWithOwner | null> {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
      include: {
        owner: { select: workspaceUserInfoSelect },
        _count: { select: { members: true, vehicles: true } },
      },
    });
  }

  async update(
    workspaceId: string,
    data: UpdateWorkspaceInput,
    tx?: PrismaTxClient,
  ): Promise<Workspace> {
    const client = tx ?? this.prisma;
    return client.workspace.update({ where: { id: workspaceId }, data });
  }

  async softDelete(workspaceId: string, tx?: PrismaTxClient): Promise<Workspace> {
    const client = tx ?? this.prisma;
    return client.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });
  }
}
