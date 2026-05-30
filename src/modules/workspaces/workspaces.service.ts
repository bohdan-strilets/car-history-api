import { randomBytes } from 'crypto';

import {
  ConflictException,
  ErrorCodes,
  ForbiddenException,
  NotFoundException,
} from '@common/exceptions';
import { AppConfigService } from '@config/config.service';
import { MailService } from '@modules/mail';
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
  WorkspaceIdDto,
  WorkspaceInviteResponseDto,
  WorkspaceMemberWithUserResponseDto,
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
import { WorkspaceInfo } from './types';
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
    private readonly mailService: MailService,
    private readonly config: AppConfigService,
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

  async getByIdWithOwner(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceWithOwnerResponseDto> {
    const workspace = await this.workspacesRepo.findByIdWithOwner(workspaceId);
    if (!workspace) throw new NotFoundException(ErrorCodes.Workspace.NOT_FOUND);

    const member = await this.workspaceMembersRepo.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new ForbiddenException(ErrorCodes.Workspace.ACCESS_DENIED);

    return toWorkspaceWithOwnerResponse(workspace, member.role);
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateWorkspaceDto): Promise<WorkspaceIdDto> {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await this.workspacesRepo.create({ ownerId: userId, ...dto }, tx);
      await this.workspaceMembersRepo.create(
        { workspaceId: workspace.id, userId, role: Role.OWNER },
        tx,
      );
      await this.workspaceSettingsRepo.create(workspace.id, tx);
      return { id: workspace.id };
    });
  }

  async update(
    workspaceId: string,
    dto: UpdateWorkspaceDto,
    userId: string,
  ): Promise<WorkspaceIdDto> {
    await this.getById(workspaceId);
    const member = await this.workspaceMembersRepo.findByWorkspaceAndUser(workspaceId, userId);
    if (!member || member.role === Role.MEMBER) {
      throw new ForbiddenException(ErrorCodes.Workspace.INSUFFICIENT_ROLE);
    }
    const workspace = await this.workspacesRepo.update(workspaceId, dto);
    return { id: workspace.id };
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

  async getMembers(workspaceId: string): Promise<WorkspaceMemberWithUserResponseDto[]> {
    await this.getById(workspaceId);
    const members = await this.workspaceMembersRepo.findAllByWorkspaceId(workspaceId);
    return members.map(toWorkspaceMemberResponse);
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    actingMember: WorkspaceMember,
  ): Promise<WorkspaceMemberWithUserResponseDto> {
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

    await this.workspaceMembersRepo.updateRole(memberId, dto.role);

    const updated = await this.workspaceMembersRepo.findByIdWithUser(memberId);
    return toWorkspaceMemberResponse(updated!);
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

  async leaveWorkspace(
    workspaceId: string,
    userId: string,
    actingMember: WorkspaceMember,
  ): Promise<void> {
    if (actingMember.role === Role.OWNER) {
      throw new ForbiddenException(ErrorCodes.Workspace.OWNER_CANNOT_LEAVE);
    }

    const member = await this.workspaceMembersRepo.findByWorkspaceAndUser(workspaceId, userId);
    if (!member) throw new NotFoundException(ErrorCodes.Workspace.NOT_FOUND);

    await this.workspaceMembersRepo.delete(member.id);
  }

  // ─── Invites ──────────────────────────────────────────────────────────────

  async createInvite(
    workspaceId: string,
    invitedById: string,
    dto: CreateInviteDto,
  ): Promise<WorkspaceInviteResponseDto> {
    const workspace = await this.getById(workspaceId);

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

    const invitedBy = await this.usersService.getById(invitedById);
    const existingUser = await this.usersService.findByEmail(dto.email);

    const userFullName = `${invitedBy.firstName} ${invitedBy.lastName}`;
    const inviteUrl = `${this.config.frontendUrl}/invite/${token}`;

    await this.mailService.sendWorkspaceInvite({
      to: dto.email,
      firstName: existingUser?.firstName ?? dto.email,
      invitedByName: userFullName,
      workspaceName: workspace.name,
      role: dto.role ?? Role.MEMBER,
      inviteUrl,
    });

    const workspaceInfo: WorkspaceInfo = {
      id: workspace.id,
      name: workspace.name,
      type: workspace.type,
    };

    return toWorkspaceInviteResponse({ ...invite, workspace: workspaceInfo });
  }

  async getInvite(token: string): Promise<WorkspaceInviteResponseDto> {
    const invite = await this.workspaceInvitesRepo.findByToken(token);

    if (!invite) {
      throw new NotFoundException(ErrorCodes.Workspace.INVITE_NOT_FOUND);
    }

    const workspace = await this.getById(invite.workspaceId);
    const workspaceInfo: WorkspaceInfo = {
      id: workspace.id,
      name: workspace.name,
      type: workspace.type,
    };

    return toWorkspaceInviteResponse({ ...invite, workspace: workspaceInfo });
  }

  async acceptInvite(token: string, userId: string): Promise<WorkspaceIdDto> {
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
      return { id: workspace!.id };
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
