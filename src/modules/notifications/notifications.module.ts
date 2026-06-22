import { MailModule } from '@modules/mail';
import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';

import { NotificationsCron } from './notifications.cron';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [NotificationsCron],
})
export class NotificationsModule {}
