import { Auth, CurrentUserId } from '@common/decorators';
import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';

import { WorkspacesService } from './workspaces.service';

@Controller('invites')
export class WorkspaceInvitesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get(':token')
  async getInvite(@Param('token') token: string) {
    return this.workspacesService.getInvite(token);
  }

  @Post(':token/accept')
  @Auth()
  async acceptInvite(@Param('token') token: string, @CurrentUserId() userId: string) {
    return this.workspacesService.acceptInvite(token, userId);
  }

  @Post(':token/reject')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectInvite(@Param('token') token: string, @CurrentUserId() userId: string) {
    return this.workspacesService.rejectInvite(token, userId);
  }
}
