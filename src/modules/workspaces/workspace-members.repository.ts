import { Injectable } from '@nestjs/common';
import { Role, WorkspaceMember } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { workspaceUserInfoSelect } from './selects';
import { CreateWorkspaceMemberInput, WorkspaceMemberWithUser } from './types';

@Injectable()
export class WorkspaceMembersRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateWorkspaceMemberInput, tx?: PrismaTxClient): Promise<WorkspaceMember> {
    const client = tx ?? this.prisma;
    return client.workspaceMember.create({ data: input });
  }

  async findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  async findAllByWorkspaceId(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: workspaceUserInfoSelect } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByIdWithUser(memberId: string): Promise<WorkspaceMemberWithUser | null> {
    return this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { user: { select: workspaceUserInfoSelect } },
    });
  }

  async findById(memberId: string): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findUnique({ where: { id: memberId } });
  }

  async updateRole(memberId: string, role: Role, tx?: PrismaTxClient): Promise<WorkspaceMember> {
    const client = tx ?? this.prisma;
    return client.workspaceMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  async delete(memberId: string, tx?: PrismaTxClient): Promise<WorkspaceMember> {
    const client = tx ?? this.prisma;
    return client.workspaceMember.delete({ where: { id: memberId } });
  }
}
