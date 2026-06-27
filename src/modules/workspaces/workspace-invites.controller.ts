import { AuditLogService } from '@common/audit';
import { Auth, CurrentUserId } from '@common/decorators';
import { Controller, Get, HttpCode, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';

import { WorkspacesService } from './workspaces.service';

@Controller('invites')
export class WorkspaceInvitesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get(':token')
  async getInvite(@Param('token') token: string) {
    return this.workspacesService.getInvite(token);
  }

  @Post(':token/accept')
  @Auth()
  async acceptInvite(
    @Param('token') token: string,
    @CurrentUserId() userId: string,
    @Req() req: Request,
  ) {
    const result = await this.workspacesService.acceptInvite(token, userId);
    this.auditLog.log({
      action: 'workspace.invite-accepted',
      userId,
      req,
      metadata: { workspaceId: result.id },
    });
    return result;
  }

  @Post(':token/reject')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectInvite(
    @Param('token') token: string,
    @CurrentUserId() userId: string,
    @Req() req: Request,
  ) {
    await this.workspacesService.rejectInvite(token, userId);
    this.auditLog.log({
      action: 'workspace.invite-rejected',
      userId,
      req,
    });
  }
}
