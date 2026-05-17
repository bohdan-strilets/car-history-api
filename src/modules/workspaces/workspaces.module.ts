import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { WorkspaceMembersRepo } from './workspace-members.repository';
import { WorkspaceSettingsRepo } from './workspace-settings.repository';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesRepo } from './workspaces.repository';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [PrismaModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspacesRepo, WorkspaceMembersRepo, WorkspaceSettingsRepo],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
