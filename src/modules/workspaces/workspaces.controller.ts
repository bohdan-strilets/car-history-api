import { Auth, CurrentUserId, EmailVerified } from '@common/decorators';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateWorkspaceDto, UpdateWorkspaceSettingsDto } from './dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@Auth()
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async getAll(@CurrentUserId() userId: string) {
    return this.workspacesService.getAllByUserId(userId);
  }

  @Post()
  @EmailVerified()
  async create(@CurrentUserId() userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(userId, dto);
  }

  @Patch(':id/settings')
  @EmailVerified()
  async updateSettings(@Param('id') workspaceId: string, @Body() dto: UpdateWorkspaceSettingsDto) {
    return this.workspacesService.updateSettings(workspaceId, dto);
  }
}
