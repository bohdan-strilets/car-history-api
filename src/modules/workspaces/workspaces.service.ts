import { randomBytes } from 'crypto';

import {
  ConflictException,
  ErrorCodes,
  ForbiddenException,
  NotFoundException,
} from '@common/exceptions';
import { UsersService } from '@modules/users';
import { Injectable } from '@nestjs/common';
import { InviteStatus, Role, Workspace, WorkspaceInvite, WorkspaceMember } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import {
  CreateInviteDto,
  CreateWorkspaceDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceSettingsDto,
  WorkspaceInviteResponseDto,
  WorkspaceMemberResponseDto,
  WorkspaceResponseDto,
  WorkspaceSettingsResponseDto,
  WorkspaceWithOwnerResponseDto,
} from './dto';
import {
  toWorkspaceInviteResponse,
  toWorkspaceMemberResponse,
  toWorkspaceResponse,
  toWorkspaceSettingsResponse,
  toWorkspaceWithOwnerResponse,
} from './mappers';
import { WorkspaceInvitesRepo } from './workspace-invites.repository';
import { WorkspaceMembersRepo } from './workspace-members.repository';
import { WorkspaceSettingsRepo } from './workspace-settings.repository';
import { WorkspacesRepo } from './workspaces.repository';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspacesRepo: WorkspacesRepo,
    private readonly workspaceMembersRepo: WorkspaceMembersRepo,
    private readonly workspaceSettingsRepo: WorkspaceSettingsRepo,
    private readonly workspaceInvitesRepo: WorkspaceInvitesRepo,
    private readonly usersService: UsersService,
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

  async getByIdWithOwner(workspaceId: string): Promise<WorkspaceWithOwnerResponseDto> {
    const workspace = await this.workspacesRepo.findByIdWithOwner(workspaceId);
    if (!workspace) throw new NotFoundException(ErrorCodes.Workspace.NOT_FOUND);
    return toWorkspaceWithOwnerResponse(workspace);
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await this.workspacesRepo.create({ ownerId: userId, ...dto }, tx);
      await this.workspaceMembersRepo.create(
        { workspaceId: workspace.id, userId, role: Role.OWNER },
        tx,
      );
      await this.workspaceSettingsRepo.create(workspace.id, tx);
      return toWorkspaceResponse(workspace);
    });
  }

  async update(
    workspaceId: string,
    dto: UpdateWorkspaceDto,
    userId: string,
  ): Promise<WorkspaceResponseDto> {
    await this.getById(workspaceId);
    const member = await this.workspaceMembersRepo.findByWorkspaceAndUser(workspaceId, userId);
    if (!member || member.role === Role.MEMBER) {
      throw new ForbiddenException(ErrorCodes.Workspace.INSUFFICIENT_ROLE);
    }
    const workspace = await this.workspacesRepo.update(workspaceId, dto);
    return toWorkspaceResponse(workspace);
  }

  async delete(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.getById(workspaceId);
    if (workspace.ownerId !== userId) {
      throw new ForbiddenException(ErrorCodes.Workspace.ACCESS_DENIED);
    }
    await this.workspacesRepo.softDelete(workspaceId);
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  async getSettings(workspaceId: string): Promise<WorkspaceSettingsResponseDto> {
    await this.getById(workspaceId);
    const settings = await this.workspaceSettingsRepo.findByWorkspaceId(workspaceId);
    if (!settings) throw new NotFoundException(ErrorCodes.Workspace.NOT_FOUND);
    return toWorkspaceSettingsResponse(settings);
  }

  async updateSettings(
    workspaceId: string,
    dto: UpdateWorkspaceSettingsDto,
  ): Promise<WorkspaceSettingsResponseDto> {
    await this.getById(workspaceId);
    const settings = await this.workspaceSettingsRepo.update(workspaceId, dto);
    return toWorkspaceSettingsResponse(settings);
  }

  // ─── Members ──────────────────────────────────────────────────────────────

  async getMembers(workspaceId: string): Promise<WorkspaceMemberResponseDto[]> {
    await this.getById(workspaceId);
    const members = await this.workspaceMembersRepo.findAllByWorkspaceId(workspaceId);
    return members.map(toWorkspaceMemberResponse);
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    actingMember: WorkspaceMember,
  ): Promise<WorkspaceMemberResponseDto> {
    const target = await this.workspaceMembersRepo.findById(memberId);

    if (!target || target.workspaceId !== workspaceId) {
      throw new NotFoundException(ErrorCodes.Workspace.NOT_FOUND);
    }

    if (target.role === Role.OWNER) {
      throw new ForbiddenException(ErrorCodes.Workspace.INSUFFICIENT_ROLE);
    }

    if (actingMember.role === Role.ADMIN && dto.role === Role.OWNER) {
      throw new ForbiddenException(ErrorCodes.Workspace.INSUFFICIENT_ROLE);
    }

    const updated = await this.workspaceMembersRepo.updateRole(memberId, dto.role);
    return toWorkspaceMemberResponse(updated);
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    actingMember: WorkspaceMember,
  ): Promise<void> {
    const target = await this.workspaceMembersRepo.findById(memberId);

    if (!target || target.workspaceId !== workspaceId) {
      throw new NotFoundException(ErrorCodes.Workspace.NOT_FOUND);
    }

    if (target.role === Role.OWNER) {
      throw new ForbiddenException(ErrorCodes.Workspace.OWNER_CANNOT_LEAVE);
    }

    if (actingMember.role === Role.ADMIN && target.role === Role.ADMIN) {
      throw new ForbiddenException(ErrorCodes.Workspace.INSUFFICIENT_ROLE);
    }

    await this.workspaceMembersRepo.delete(memberId);
  }

  // ─── Invites ──────────────────────────────────────────────────────────────

  async createInvite(
    workspaceId: string,
    invitedById: string,
    dto: CreateInviteDto,
  ): Promise<WorkspaceInviteResponseDto> {
    await this.getById(workspaceId);

    const existing = await this.workspaceInvitesRepo.findPendingByWorkspaceAndEmail(
      workspaceId,
      dto.email,
    );
    if (existing) throw new ConflictException(ErrorCodes.Workspace.ALREADY_MEMBER);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.workspaceInvitesRepo.create({
      workspaceId,
      invitedById,
      email: dto.email,
      role: dto.role ?? Role.MEMBER,
      token,
      expiresAt,
    });

    return toWorkspaceInviteResponse(invite);
  }

  async getInvite(token: string): Promise<WorkspaceInviteResponseDto> {
    const invite = await this.workspaceInvitesRepo.findByToken(token);
    if (!invite) throw new NotFoundException(ErrorCodes.Workspace.INVITE_NOT_FOUND);
    return toWorkspaceInviteResponse(invite);
  }

  async acceptInvite(token: string, userId: string): Promise<WorkspaceResponseDto> {
    const user = await this.usersService.getById(userId);
    const invite = await this.validateInvite(token, user.email);

    const existingMember = await this.workspaceMembersRepo.findByWorkspaceAndUser(
      invite.workspaceId,
      userId,
    );
    if (existingMember) throw new ConflictException(ErrorCodes.Workspace.ALREADY_MEMBER);

    return this.prisma.$transaction(async (tx) => {
      await this.workspaceInvitesRepo.updateStatus(token, InviteStatus.ACCEPTED, tx);
      await this.workspaceMembersRepo.create(
        { workspaceId: invite.workspaceId, userId, role: invite.role },
        tx,
      );
      const workspace = await this.workspacesRepo.findById(invite.workspaceId, tx);
      return toWorkspaceResponse(workspace!);
    });
  }

  async rejectInvite(token: string, userId: string): Promise<void> {
    const user = await this.usersService.getById(userId);
    await this.validateInvite(token, user.email);
    await this.workspaceInvitesRepo.updateStatus(token, InviteStatus.REJECTED);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async validateInvite(token: string, userEmail: string): Promise<WorkspaceInvite> {
    const invite = await this.workspaceInvitesRepo.findByToken(token);
    if (!invite) throw new NotFoundException(ErrorCodes.Workspace.INVITE_NOT_FOUND);

    if (invite.status === InviteStatus.ACCEPTED || invite.status === InviteStatus.REJECTED) {
      throw new ConflictException(ErrorCodes.Workspace.INVITE_ALREADY_USED);
    }

    if (invite.expiresAt < new Date()) {
      await this.workspaceInvitesRepo.updateStatus(token, InviteStatus.EXPIRED);
      throw new ConflictException(ErrorCodes.Workspace.INVITE_EXPIRED);
    }

    if (invite.email !== userEmail) {
      throw new ForbiddenException(ErrorCodes.Workspace.INVITE_EMAIL_MISMATCH);
    }

    return invite;
  }
}
