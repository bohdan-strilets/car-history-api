import { Injectable } from '@nestjs/common';
import { InviteStatus, WorkspaceInvite } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { workspaceInfoSelect } from './selects';
import { CreateWorkspaceInviteInput, WorkspaceInviteWithWorkspace } from './types';

@Injectable()
export class WorkspaceInvitesRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findByToken(token: string): Promise<WorkspaceInvite | null> {
    return this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: { select: workspaceInfoSelect } },
    });
  }

  async findPendingByWorkspaceAndEmail(
    workspaceId: string,
    email: string,
  ): Promise<WorkspaceInvite | null> {
    return this.prisma.workspaceInvite.findFirst({
      where: { workspaceId, email, status: InviteStatus.PENDING },
    });
  }

  async findPendingByWorkspaceAndId(
    workspaceId: string,
    id: string,
  ): Promise<WorkspaceInvite | null> {
    return this.prisma.workspaceInvite.findFirst({
      where: { id, workspaceId, status: InviteStatus.PENDING },
    });
  }

  async findPendingByWorkspaceId(workspaceId: string): Promise<WorkspaceInviteWithWorkspace[]> {
    return this.prisma.workspaceInvite.findMany({
      where: { workspaceId, status: InviteStatus.PENDING },
      include: { workspace: { select: workspaceInfoSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateWorkspaceInviteInput, tx?: PrismaTxClient): Promise<WorkspaceInvite> {
    const client = tx ?? this.prisma;
    return client.workspaceInvite.create({ data: input });
  }

  async updateStatus(
    token: string,
    status: InviteStatus,
    tx?: PrismaTxClient,
  ): Promise<WorkspaceInvite> {
    const client = tx ?? this.prisma;
    return client.workspaceInvite.update({
      where: { token },
      data: { status },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.workspaceInvite.delete({ where: { id } });
  }

  async deleteAllByWorkspaceId(workspaceId: string, tx?: PrismaTxClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.workspaceInvite.deleteMany({ where: { workspaceId } });
  }
}
