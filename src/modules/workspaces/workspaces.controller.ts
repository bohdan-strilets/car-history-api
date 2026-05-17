import { Auth, CurrentUserId } from '@common/decorators';
import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreateWorkspaceDto } from './dto';
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
  async create(@CurrentUserId() userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(userId, dto);
  }
}
