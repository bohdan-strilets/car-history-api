import { WorkspaceMemberGuard } from '@common/guards';
import { AppConfigModule } from '@config/config.module';
import { MailModule } from '@modules/mail';
import { UsersModule } from '@modules/users';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { WorkspaceInvitesController } from './workspace-invites.controller';
import { WorkspaceInvitesRepo } from './workspace-invites.repository';
import { WorkspaceMembersRepo } from './workspace-members.repository';
import { WorkspaceSettingsRepo } from './workspace-settings.repository';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesRepo } from './workspaces.repository';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [PrismaModule, UsersModule, MailModule, AppConfigModule],
  controllers: [WorkspacesController, WorkspaceInvitesController],
  providers: [
    WorkspacesService,
    WorkspacesRepo,
    WorkspaceMembersRepo,
    WorkspaceSettingsRepo,
    WorkspaceInvitesRepo,
    WorkspaceMemberGuard,
  ],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
