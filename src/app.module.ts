import { CryptoModule } from '@common/crypto';
import { AiModule } from '@modules/ai';
import { AuthModule } from '@modules/auth';
import { MailModule } from '@modules/mail';
import { MaintenanceIntervalsModule } from '@modules/maintenance-intervals';
import { MilestonesModule } from '@modules/milestones';
import { RemindersModule } from '@modules/reminders';
import { SessionsModule } from '@modules/sessions';
import { TimelineModule } from '@modules/timeline';
import { TokensModule } from '@modules/tokens';
import { UsersModule } from '@modules/users';
import { VehiclesModule } from '@modules/vehicles';
import { WorkspacesModule } from '@modules/workspaces';
import { Module } from '@nestjs/common';

import { AppConfigModule } from './config';
import { PrismaModule } from './prisma';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    CryptoModule,
    TokensModule,
    UsersModule,
    SessionsModule,
    AuthModule,
    MailModule,
    WorkspacesModule,
    VehiclesModule,
    TimelineModule,
    MilestonesModule,
    MaintenanceIntervalsModule,
    RemindersModule,
    AiModule,
  ],
})
export class AppModule {}
