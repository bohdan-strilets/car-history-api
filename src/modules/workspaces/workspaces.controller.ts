import {
  Auth,
  CurrentUserId,
  CurrentWorkspaceMember,
  EmailVerified,
  WorkspaceMember,
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
} from '@nestjs/common';
import { WorkspaceMember as WorkspaceMemberEntity } from '@prisma/client';

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
  constructor(private readonly workspacesService: WorkspacesService) {}

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
  async getOne(@Param('id') workspaceId: string) {
    return this.workspacesService.getByIdWithOwner(workspaceId);
  }

  @Patch(':id')
  async update(
    @Param('id') workspaceId: string,
    @CurrentUserId() userId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(workspaceId, dto, userId);
  }

  @Delete(':id')
  @WorkspaceMember()
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

  @Patch(':id/members/:memberId')
  @WorkspaceMember()
  @EmailVerified()
  async updateMemberRole(
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentWorkspaceMember() member: WorkspaceMemberEntity,
  ) {
    return this.workspacesService.updateMemberRole(workspaceId, memberId, dto, member);
  }

  @Delete(':id/members/:memberId')
  @WorkspaceMember()
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') workspaceId: string,
    @Param('memberId') memberId: string,
    @CurrentWorkspaceMember() member: WorkspaceMemberEntity,
  ) {
    return this.workspacesService.removeMember(workspaceId, memberId, member);
  }

  // ─── Invites ──────────────────────────────────────────────────────────────

  @Post(':id/invites')
  @WorkspaceMember()
  @EmailVerified()
  async createInvite(
    @Param('id') workspaceId: string,
    @CurrentUserId() userId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.workspacesService.createInvite(workspaceId, userId, dto);
  }
}
