import { REMINDER_THRESHOLD_DAYS, TIME_UNITS } from '@common/constants';
import { MailService } from '@modules/mail';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationChannel, NotificationStatus, ReminderStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { NotificationsCron } from './notifications.cron';

describe('NotificationsCron', () => {
  let cron: NotificationsCron;
  let prisma: jest.Mocked<PrismaService>;
  let mailService: jest.Mocked<MailService>;

  const mockReminder = {
    id: 'reminder-123',
    title: 'Oil Change',
    dueDate: new Date('2026-07-01'),
    vehicleId: 'vehicle-123',
    vehicle: {
      brand: 'BMW',
      model: 'X5',
      year: 2020,
      ownerId: 'user-123',
      owner: {
        email: 'test@example.com',
        firstName: 'John',
        userSettings: { notificationsEmail: true },
      },
    },
    notifications: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsCron,
        {
          provide: PrismaService,
          useValue: {
            reminder: {
              findMany: jest.fn(),
            },
            notification: {
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: MailService,
          useValue: {
            sendReminderNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    cron = module.get<NotificationsCron>(NotificationsCron);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;

    jest.spyOn(cron['logger'], 'log');
    jest.spyOn(cron['logger'], 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleReminderNotifications', () => {
    it('should process active reminders successfully', async () => {
      const now = new Date();
      const daysUntilDue = REMINDER_THRESHOLD_DAYS[0];
      const dueDate = new Date(now.getTime() + daysUntilDue * TIME_UNITS.MILLISECONDS_PER_DAY);

      const reminder = {
        ...mockReminder,
        dueDate,
        notifications: [],
      };

      (prisma.reminder.findMany as jest.Mock).mockResolvedValue([reminder]);
      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        status: NotificationStatus.PENDING,
      });
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        status: NotificationStatus.SENT,
      });
      (mailService.sendReminderNotification as jest.Mock).mockResolvedValue(undefined);

      await cron.handleReminderNotifications();

      expect(prisma.reminder.findMany).toHaveBeenCalled();
      expect(mailService.sendReminderNotification).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalled();
      expect(prisma.notification.update).toHaveBeenCalled();
    });

    it('should skip reminders with null dueDate', async () => {
      const reminder = {
        ...mockReminder,
        dueDate: null,
        notifications: [],
      };

      (prisma.reminder.findMany as jest.Mock).mockResolvedValue([reminder]);

      await cron.handleReminderNotifications();

      expect(mailService.sendReminderNotification).not.toHaveBeenCalled();
    });

    it('should skip reminders not matching threshold days', async () => {
      const now = new Date();
      const daysUntilDue = 3; // Not in REMINDER_THRESHOLD_DAYS
      const dueDate = new Date(now.getTime() + daysUntilDue * TIME_UNITS.MILLISECONDS_PER_DAY);

      const reminder = {
        ...mockReminder,
        dueDate,
        notifications: [],
      };

      (prisma.reminder.findMany as jest.Mock).mockResolvedValue([reminder]);

      await cron.handleReminderNotifications();

      expect(mailService.sendReminderNotification).not.toHaveBeenCalled();
    });

    it('should skip reminders that were already notified today', async () => {
      const now = new Date();
      const daysUntilDue = REMINDER_THRESHOLD_DAYS[0];
      const dueDate = new Date(now.getTime() + daysUntilDue * TIME_UNITS.MILLISECONDS_PER_DAY);

      const reminder = {
        ...mockReminder,
        dueDate,
        notifications: [
          {
            createdAt: now,
            channel: NotificationChannel.EMAIL,
          },
        ],
      };

      (prisma.reminder.findMany as jest.Mock).mockResolvedValue([reminder]);

      await cron.handleReminderNotifications();

      expect(mailService.sendReminderNotification).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      (prisma.reminder.findMany as jest.Mock).mockRejectedValue(error);

      await cron.handleReminderNotifications();

      expect(cron['logger'].error).toHaveBeenCalled();
    });

    it('should filter reminders within date range', async () => {
      (prisma.reminder.findMany as jest.Mock).mockResolvedValue([]);

      await cron.handleReminderNotifications();

      expect(prisma.reminder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ReminderStatus.ACTIVE,
            dueDate: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('sendEmailNotification', () => {
    it('should send email notification successfully', async () => {
      const now = new Date();
      const daysLeft = 7;

      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notification-123',
      });
      (mailService.sendReminderNotification as jest.Mock).mockResolvedValue(undefined);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        status: NotificationStatus.SENT,
      });

      await cron['sendEmailNotification'](mockReminder, daysLeft, now);

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(mailService.sendReminderNotification).toHaveBeenCalled();
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notification-123' },
          data: {
            status: NotificationStatus.SENT,
            sentAt: now,
          },
        }),
      );
    });

    it('should return early if user has notifications disabled', async () => {
      const now = new Date();
      const daysLeft = 7;

      const reminderWithDisabledNotifications = {
        ...mockReminder,
        vehicle: {
          ...mockReminder.vehicle,
          owner: {
            ...mockReminder.vehicle.owner,
            userSettings: { notificationsEmail: false },
          },
        },
      };

      await cron['sendEmailNotification'](reminderWithDisabledNotifications, daysLeft, now);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should return early if user settings is null', async () => {
      const now = new Date();
      const daysLeft = 7;

      const reminderWithNullSettings = {
        ...mockReminder,
        vehicle: {
          ...mockReminder.vehicle,
          owner: {
            ...mockReminder.vehicle.owner,
            userSettings: null,
          },
        },
      };

      await cron['sendEmailNotification'](reminderWithNullSettings, daysLeft, now);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('should mark notification as failed if email sending fails', async () => {
      const now = new Date();
      const daysLeft = 7;

      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notification-123',
      });
      (mailService.sendReminderNotification as jest.Mock).mockRejectedValue(
        new Error('Email service error'),
      );
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        status: NotificationStatus.FAILED,
      });

      await cron['sendEmailNotification'](mockReminder, daysLeft, now);

      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notification-123' },
          data: { status: NotificationStatus.FAILED },
        }),
      );
      expect(cron['logger'].error).toHaveBeenCalled();
    });

    it('should handle failure to mark notification as failed', async () => {
      const now = new Date();
      const daysLeft = 7;

      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notification-123',
      });
      (mailService.sendReminderNotification as jest.Mock).mockRejectedValue(
        new Error('Email service error'),
      );
      (prisma.notification.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await cron['sendEmailNotification'](mockReminder, daysLeft, now);

      expect(cron['logger'].error).toHaveBeenCalled();
    });

    it('should handle errors during notification creation', async () => {
      const now = new Date();
      const daysLeft = 7;

      (prisma.notification.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await cron['sendEmailNotification'](mockReminder, daysLeft, now);

      expect(cron['logger'].error).toHaveBeenCalled();
    });

    it('should send notification with correct data', async () => {
      const now = new Date();
      const daysLeft = 7;

      (prisma.notification.create as jest.Mock).mockResolvedValue({
        id: 'notification-123',
      });
      (mailService.sendReminderNotification as jest.Mock).mockResolvedValue(undefined);
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        id: 'notification-123',
        status: NotificationStatus.SENT,
      });

      await cron['sendEmailNotification'](mockReminder, daysLeft, now);

      expect(mailService.sendReminderNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockReminder.vehicle.owner.email,
          firstName: mockReminder.vehicle.owner.firstName,
          reminderTitle: mockReminder.title,
          daysLeft,
          vehicleName: 'BMW X5 2020',
        }),
      );
    });
  });
});
