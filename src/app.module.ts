import { CryptoModule } from '@common/crypto';
import { AiModule } from '@modules/ai';
import { AuthModule } from '@modules/auth';
import { MailModule } from '@modules/mail';
import { MaintenanceModule } from '@modules/maintenance';
import { MediaModule } from '@modules/media';
import { MilestonesModule } from '@modules/milestones';
import { NotificationsModule } from '@modules/notifications';
import { RemindersModule } from '@modules/reminders';
import { ServiceStationsModule } from '@modules/service-stations';
import { SessionsModule } from '@modules/sessions';
import { StatsModule } from '@modules/stats';
import { TimelineModule } from '@modules/timeline';
import { TiresModule } from '@modules/tires';
import { TokensModule } from '@modules/tokens';
import { UsersModule } from '@modules/users';
import { VehiclesModule } from '@modules/vehicles';
import { WorkspacesModule } from '@modules/workspaces';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

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
    MaintenanceModule,
    RemindersModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    StatsModule,
    MediaModule,
    TiresModule,
    ServiceStationsModule,
    AiModule,
  ],
})
export class AppModule {}
