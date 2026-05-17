import { ErrorCodes, NotFoundException } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { Role, Workspace } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import {
  CreateWorkspaceDto,
  UpdateWorkspaceSettingsDto,
  WorkspaceResponseDto,
  WorkspaceSettingsResponseDto,
} from './dto';
import { toWorkspaceResponse, toWorkspaceSettingsResponse } from './mappers';
import { WorkspaceMembersRepo } from './workspace-members.repository';
import { WorkspaceSettingsRepo } from './workspace-settings.repository';
import { WorkspacesRepo } from './workspaces.repository';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspacesRepo: WorkspacesRepo,
    private readonly workspaceMembersRepo: WorkspaceMembersRepo,
    private readonly workspaceSettingsRepo: WorkspaceSettingsRepo,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getById(workspaceId: string): Promise<Workspace> {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundException(ErrorCodes.Workspace.NOT_FOUND);
    return workspace;
  }

  async getAllByUserId(userId: string): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.workspacesRepo.findAllByUserId(userId);
    return workspaces.map(toWorkspaceResponse);
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const workspaceDto = { ownerId: userId, ...dto };
      const workspace = await this.workspacesRepo.create(workspaceDto, tx);

      const memberDto = { workspaceId: workspace.id, userId, role: Role.OWNER };
      await this.workspaceMembersRepo.create(memberDto, tx);

      await this.workspaceSettingsRepo.create(workspace.id, tx);

      return toWorkspaceResponse(workspace);
    });
  }

  async updateSettings(
    workspaceId: string,
    dto: UpdateWorkspaceSettingsDto,
  ): Promise<WorkspaceSettingsResponseDto> {
    await this.getById(workspaceId);

    const settings = await this.workspaceSettingsRepo.update(workspaceId, dto);
    return toWorkspaceSettingsResponse(settings);
  }
}
