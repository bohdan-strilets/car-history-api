import { REMINDER_THRESHOLD_DAYS, TIME_UNITS } from '@common/constants';
import { MailService } from '@modules/mail';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationChannel, NotificationStatus, ReminderStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleReminderNotifications(): Promise<void> {
    this.logger.log('⏰ Running reminder notifications cron...');

    const now = new Date();
    const maxDays = Math.max(...REMINDER_THRESHOLD_DAYS);

    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + maxDays);

    const reminders = await this.prisma.reminder.findMany({
      where: {
        status: ReminderStatus.ACTIVE,
        dueDate: { gte: now, lte: maxDate },
      },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            year: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                email: true,
                firstName: true,
                userSettings: { select: { notificationsEmail: true } },
              },
            },
          },
        },
        notifications: { select: { createdAt: true, channel: true } },
      },
    });

    this.logger.log(`Found ${reminders.length} active reminders to check`);

    for (const reminder of reminders) {
      if (!reminder.dueDate) continue;

      const daysLeft = Math.ceil(
        (reminder.dueDate.getTime() - now.getTime()) / TIME_UNITS.MILLISECONDS_PER_DAY,
      );

      if (!REMINDER_THRESHOLD_DAYS.includes(daysLeft)) continue;

      const alreadySentToday = reminder.notifications.some((n) => {
        const sentDate = new Date(n.createdAt);
        return (
          n.channel === NotificationChannel.EMAIL && sentDate.toDateString() === now.toDateString()
        );
      });

      if (alreadySentToday) continue;

      await this.sendEmailNotification(reminder, daysLeft, now);
    }

    this.logger.log('✅ Reminder notifications cron completed');
  }

  private async sendEmailNotification(
    reminder: {
      id: string;
      title: string;
      dueDate: Date | null;
      vehicleId: string;
      vehicle: {
        brand: string;
        model: string;
        year: number;
        ownerId: string;
        owner: {
          email: string;
          firstName: string;
          userSettings: { notificationsEmail: boolean } | null;
        };
      };
    },
    daysLeft: number,
    now: Date,
  ): Promise<void> {
    const user = reminder.vehicle.owner;

    if (!user || !user.userSettings?.notificationsEmail) return;

    const vehicleName = `${reminder.vehicle.brand} ${reminder.vehicle.model} ${reminder.vehicle.year}`;
    const dueDate = reminder.dueDate!.toLocaleDateString('pl-PL');

    const notification = await this.prisma.notification.create({
      data: {
        reminderId: reminder.id,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.PENDING,
      },
    });

    try {
      await this.mailService.sendReminderNotification({
        to: user.email,
        firstName: user.firstName,
        reminderTitle: reminder.title,
        dueDate,
        daysLeft,
        vehicleName,
      });

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENT, sentAt: now },
      });

      this.logger.log(`✅ Sent reminder notification for "${reminder.title}" to ${user.email}`);
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED },
      });

      this.logger.error(
        `❌ Failed to send notification for reminder ${reminder.id}: ${String(error)}`,
      );
    }
  }
}
