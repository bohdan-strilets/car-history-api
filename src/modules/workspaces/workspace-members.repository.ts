import { Injectable } from '@nestjs/common';
import { WorkspaceMember } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { CreateWorkspaceMemberInput } from './types';

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
}
