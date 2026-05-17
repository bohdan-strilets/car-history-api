import { Injectable } from '@nestjs/common';
import { Workspace } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { CreateWorkspaceInput } from './types';

@Injectable()
export class WorkspacesRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findById(workspaceId: string): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({
      where: { id: workspaceId, deletedAt: null },
    });
  }

  async findAllByUserId(userId: string): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: {
        deletedAt: null,
        members: { some: { userId } },
      },
    });
  }

  async create(input: CreateWorkspaceInput, tx?: PrismaTxClient): Promise<Workspace> {
    const client = tx ?? this.prisma;
    return client.workspace.create({ data: input });
  }
}
