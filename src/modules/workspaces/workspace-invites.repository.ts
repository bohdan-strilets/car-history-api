import { Injectable } from '@nestjs/common';
import { InviteStatus, WorkspaceInvite } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { workspaceInfoSelect } from './selects';
import { CreateWorkspaceInviteInput } from './types';

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
}
