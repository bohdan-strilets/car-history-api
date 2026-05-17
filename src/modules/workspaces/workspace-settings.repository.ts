import { Injectable } from '@nestjs/common';
import { WorkspaceSettings } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { PrismaTxClient } from '@prisma/prisma.types';

import { UpdateWorkspaceSettingsInput } from './types';

@Injectable()
export class WorkspaceSettingsRepo {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string, tx?: PrismaTxClient): Promise<WorkspaceSettings> {
    const client = tx ?? this.prisma;
    return client.workspaceSettings.create({ data: { workspaceId } });
  }

  async findByWorkspaceId(workspaceId: string): Promise<WorkspaceSettings | null> {
    return this.prisma.workspaceSettings.findUnique({ where: { workspaceId } });
  }

  async update(
    workspaceId: string,
    data: UpdateWorkspaceSettingsInput,
    tx?: PrismaTxClient,
  ): Promise<WorkspaceSettings> {
    const client = tx ?? this.prisma;
    return client.workspaceSettings.update({
      where: { workspaceId },
      data,
    });
  }
}
