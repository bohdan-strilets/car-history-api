import { AuditLogService } from '@common/audit';
import {
  Auth,
  CurrentUserId,
  CurrentWorkspaceMember,
  EmailVerified,
  WorkspaceMember,
  WorkspaceRole,
} from '@common/decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { WorkspaceMember as WorkspaceMemberEntity, Role } from '@prisma/client';
import { Request } from 'express';

import {
  CreateInviteDto,
  CreateWorkspaceDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceSettingsDto,
} from './dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@Auth()
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ─── Workspace ────────────────────────────────────────────────────────────

  @Get()
  async getAll(@CurrentUserId() userId: string) {
    return this.workspacesService.getAllByUserId(userId);
  }

  @Post()
  @EmailVerified()
  async create(@CurrentUserId() userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(userId, dto);
  }

  @Get(':id')
  @WorkspaceMember()
  async getOne(@Param('id') workspaceId: string, @CurrentUserId() userId: string) {
    return this.workspacesService.getByIdWithOwner(workspaceId, userId);
  }

  @Patch(':id')
  @WorkspaceRole(Role.OWNER, Role.ADMIN)
  async update(
    @Param('id') workspaceId: string,
    @CurrentUserId() userId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(workspaceId, dto, userId);
  }

  @Delete(':id')
  @WorkspaceRole(Role.OWNER)
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') workspaceId: string, @CurrentUserId() userId: string) {
    return this.workspacesService.delete(workspaceId, userId);
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  @Get(':id/settings')
  @WorkspaceMember()
  async getSettings(@Param('id') workspaceId: string) {
    return this.workspacesService.getSettings(workspaceId);
  }

  @Patch(':id/settings')
  @WorkspaceMember()
  @EmailVerified()
  async updateSettings(@Param('id') workspaceId: string, @Body() dto: UpdateWorkspaceSettingsDto) {
    return this.workspacesService.updateSettings(workspaceId, dto);
  }

  // ─── Members ──────────────────────────────────────────────────────────────

  @Get(':id/members')
  @WorkspaceMember()
  async getMembers(@Param('id') workspaceId: string) {
    return this.workspacesService.getMembers(workspaceId);
  }

  @Delete(':id/members/me')
  @WorkspaceMember()
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveWorkspace(
    @Param('id') workspaceId: string,
    @CurrentUserId() userId: string,
    @CurrentWorkspaceMember() member: WorkspaceMemberEntity,
  ) {
    return this.workspacesService.leaveWorkspace(workspaceId, userId, member);
  }

  @Patch(':id/members/:memberId')
  @WorkspaceRole(Role.OWNER, Role.ADMIN)
  @EmailVerified()
  async updateMemberRole(
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentWorkspaceMember() member: WorkspaceMemberEntity,
    @Req() req: Request,
  ) {
    const result = await this.workspacesService.updateMemberRole(
      workspaceId,
      memberId,
      dto,
      member,
    );
    this.auditLog.log({
      action: 'workspace.member-role-updated',
      userId: member.userId,
      req,
      metadata: { workspaceId, memberId, role: dto.role },
    });
    return result;
  }

  @Delete(':id/members/:memberId')
  @WorkspaceRole(Role.OWNER, Role.ADMIN)
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentWorkspaceMember() member: WorkspaceMemberEntity,
    @Req() req: Request,
  ) {
    await this.workspacesService.removeMember(workspaceId, memberId, member);
    this.auditLog.log({
      action: 'workspace.member-removed',
      userId: member.userId,
      req,
      metadata: { workspaceId, memberId },
    });
  }

  // ─── Invites ──────────────────────────────────────────────────────────────

  @Post(':id/invites')
  @WorkspaceRole(Role.OWNER, Role.ADMIN)
  @EmailVerified()
  async createInvite(
    @Param('id') workspaceId: string,
    @CurrentUserId() userId: string,
    @Body() dto: CreateInviteDto,
    @Req() req: Request,
  ) {
    const result = await this.workspacesService.createInvite(workspaceId, userId, dto);
    this.auditLog.log({
      action: 'workspace.invite-created',
      userId,
      req,
      metadata: { workspaceId, email: dto.email, role: dto.role ?? Role.MEMBER },
    });
    return result;
  }

  @Get(':id/invites')
  @WorkspaceMember()
  async getPendingInvites(@Param('id') workspaceId: string) {
    return this.workspacesService.getPendingInvites(workspaceId);
  }

  @Delete(':id/invites/:inviteId')
  @WorkspaceRole(Role.OWNER, Role.ADMIN)
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelInvite(
    @Param('id') workspaceId: string,
    @Param('inviteId') inviteId: string,
    @CurrentWorkspaceMember() member: WorkspaceMemberEntity,
  ) {
    return this.workspacesService.cancelInvite(workspaceId, inviteId, member);
  }
}
