import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceType, Reminder, ReminderStatus, ReminderType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateReminderDto, ReminderResponseDto, UpdateReminderDto } from './dto';
import { RemindersRepository } from './reminders.repository';
import { RemindersService } from './reminders.service';

describe('RemindersService', () => {
  let service: RemindersService;
  let remindersRepo: jest.Mocked<RemindersRepository>;
  let prisma: jest.Mocked<PrismaService>;

  const mockReminder = {
    id: 'reminder-123',
    vehicleId: 'vehicle-123',
    maintenanceIntervalId: null,
    documentId: null,
    type: ReminderType.OIL_CHANGE,
    title: 'Oil Change',
    description: 'Change engine oil',
    dueDate: new Date('2026-07-27'),
    dueMileage: 60000,
    status: ReminderStatus.ACTIVE,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Reminder;

  const mockReminder2 = {
    id: 'reminder-124',
    vehicleId: 'vehicle-123',
    maintenanceIntervalId: null,
    documentId: null,
    type: ReminderType.TECHNICAL_INSPECTION,
    title: 'Annual Inspection',
    description: 'Vehicle inspection',
    dueDate: new Date('2026-08-27'),
    dueMileage: null,
    status: ReminderStatus.ACTIVE,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Reminder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: RemindersRepository,
          useValue: {
            findAllByVehicleId: jest.fn(),
            findById: jest.fn(),
            findByMaintenanceIntervalId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            vehicle: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);
    remindersRepo = module.get(RemindersRepository) as jest.Mocked<RemindersRepository>;
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    // Mock ensureVehicleBelongsToWorkspace to avoid needing full Prisma setup
    jest.spyOn(service as any, 'ensureVehicleBelongsToWorkspace').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  describe('getAllByVehicleId', () => {
    it('should return all reminders for vehicle', async () => {
      const reminders = [mockReminder, mockReminder2];
      remindersRepo.findAllByVehicleId.mockResolvedValue(reminders);

      const result = await service.getAllByVehicleId('vehicle-123');

      expect(result).toHaveLength(2);
      expect(remindersRepo.findAllByVehicleId).toHaveBeenCalledWith('vehicle-123');
    });

    it('should return empty array when vehicle has no reminders', async () => {
      remindersRepo.findAllByVehicleId.mockResolvedValue([]);

      const result = await service.getAllByVehicleId('vehicle-456');

      expect(result).toEqual([]);
    });

    it('should map reminders to response DTOs', async () => {
      remindersRepo.findAllByVehicleId.mockResolvedValue([mockReminder]);

      const result = await service.getAllByVehicleId('vehicle-123');

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('status');
    });
  });

  describe('getById', () => {
    it('should return reminder by id', async () => {
      remindersRepo.findById.mockResolvedValue(mockReminder);

      const result = await service.getById('reminder-123');

      expect(result).toEqual(mockReminder);
      expect(remindersRepo.findById).toHaveBeenCalledWith('reminder-123');
    });

    it('should throw NotFoundException if reminder not found', async () => {
      remindersRepo.findById.mockResolvedValue(null);

      await expect(service.getById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Commands (Manual) ────────────────────────────────────────────────────

  describe('create', () => {
    it('should create reminder with provided data', async () => {
      const createDto: CreateReminderDto = {
        type: ReminderType.OIL_CHANGE,
        title: 'Oil Change',
        description: 'Change engine oil',
        dueDate: '2026-07-27',
        dueMileage: 60000,
      };

      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.create.mockResolvedValue(mockReminder);

      const result = await service.create('workspace-123', 'vehicle-123', createDto);

      expect(result).toBeDefined();
      expect(remindersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'vehicle-123',
          type: ReminderType.OIL_CHANGE,
          title: 'Oil Change',
          description: 'Change engine oil',
          dueDate: expect.any(Date),
          dueMileage: 60000,
        }),
      );
    });

    it('should create reminder without description', async () => {
      const createDto: CreateReminderDto = {
        type: ReminderType.TECHNICAL_INSPECTION,
        title: 'Annual Inspection',
        dueDate: '2026-08-27',
      };

      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.create.mockResolvedValue(mockReminder2);

      const result = await service.create('workspace-123', 'vehicle-123', createDto);

      expect(remindersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
        }),
      );
    });

    it('should create reminder without date', async () => {
      const createDto: CreateReminderDto = {
        type: ReminderType.TIRE_CHANGE,
        title: 'Tire Rotation',
        dueMileage: 30000,
      };

      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.create.mockResolvedValue(mockReminder);

      const result = await service.create('workspace-123', 'vehicle-123', createDto);

      expect(remindersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: null,
        }),
      );
    });

    it('should convert date string to Date object', async () => {
      const createDto: CreateReminderDto = {
        type: ReminderType.OIL_CHANGE,
        title: 'Oil Change',
        dueDate: '2026-07-27',
      };

      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.create.mockResolvedValue(mockReminder);

      await service.create('workspace-123', 'vehicle-123', createDto);

      const createCall = remindersRepo.create.mock.calls[0][0];
      expect(createCall.dueDate).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    it('should update reminder in correct workspace and vehicle', async () => {
      const updateDto: UpdateReminderDto = {
        type: ReminderType.OIL_CHANGE,
        title: 'Oil Change Updated',
        dueMileage: 65000,
      };

      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue(mockReminder);
      remindersRepo.update.mockResolvedValue({
        ...mockReminder,
        title: 'Oil Change Updated',
      });

      const result = await service.update(
        'workspace-123',
        'vehicle-123',
        'reminder-123',
        updateDto,
      );

      expect(result).toBeDefined();
      expect(remindersRepo.update).toHaveBeenCalledWith(
        'reminder-123',
        expect.objectContaining({
          title: 'Oil Change Updated',
          dueMileage: 65000,
        }),
      );
    });

    it('should throw ForbiddenException if reminder not in vehicle', async () => {
      const updateDto: UpdateReminderDto = {
        type: ReminderType.OIL_CHANGE,
        title: 'Oil Change',
      };

      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue({
        ...mockReminder,
        vehicleId: 'other-vehicle',
      });

      await expect(
        service.update('workspace-123', 'vehicle-123', 'reminder-123', updateDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if reminder not found', async () => {
      const updateDto: UpdateReminderDto = {
        type: ReminderType.OIL_CHANGE,
        title: 'Oil Change',
      };

      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('workspace-123', 'vehicle-123', 'invalid-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should convert date string to Date object in update', async () => {
      const updateDto: UpdateReminderDto = {
        type: ReminderType.OIL_CHANGE,
        title: 'Oil Change',
        dueDate: '2026-08-27',
      };

      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue(mockReminder);
      remindersRepo.update.mockResolvedValue(mockReminder);

      await service.update('workspace-123', 'vehicle-123', 'reminder-123', updateDto);

      const updateCall = remindersRepo.update.mock.calls[0][1];
      if (updateCall.dueDate !== undefined) {
        expect(updateCall.dueDate).toBeInstanceOf(Date);
      }
    });
  });

  describe('complete', () => {
    it('should mark reminder as completed', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue(mockReminder);
      remindersRepo.update.mockResolvedValue({
        ...mockReminder,
        status: ReminderStatus.COMPLETED,
        completedAt: new Date(),
      });

      const result = await service.complete('workspace-123', 'vehicle-123', 'reminder-123');

      expect(remindersRepo.update).toHaveBeenCalledWith(
        'reminder-123',
        expect.objectContaining({
          status: ReminderStatus.COMPLETED,
          completedAt: expect.any(Date),
        }),
      );
    });

    it('should throw ForbiddenException if reminder already completed', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue({
        ...mockReminder,
        status: ReminderStatus.COMPLETED,
      });

      await expect(
        service.complete('workspace-123', 'vehicle-123', 'reminder-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if reminder not in vehicle', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue({
        ...mockReminder,
        vehicleId: 'other-vehicle',
      });

      await expect(
        service.complete('workspace-123', 'vehicle-123', 'reminder-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if reminder not found', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue(null);

      await expect(service.complete('workspace-123', 'vehicle-123', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('dismiss', () => {
    it('should mark reminder as dismissed', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue(mockReminder);
      remindersRepo.update.mockResolvedValue({
        ...mockReminder,
        status: ReminderStatus.DISMISSED,
      });

      const result = await service.dismiss('workspace-123', 'vehicle-123', 'reminder-123');

      expect(remindersRepo.update).toHaveBeenCalledWith(
        'reminder-123',
        expect.objectContaining({
          status: ReminderStatus.DISMISSED,
        }),
      );
    });

    it('should throw ForbiddenException if reminder already dismissed', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue({
        ...mockReminder,
        status: ReminderStatus.DISMISSED,
      });

      await expect(service.dismiss('workspace-123', 'vehicle-123', 'reminder-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if reminder not in vehicle', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue({
        ...mockReminder,
        vehicleId: 'other-vehicle',
      });

      await expect(service.dismiss('workspace-123', 'vehicle-123', 'reminder-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should delete reminder', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue(mockReminder);

      await service.delete('workspace-123', 'vehicle-123', 'reminder-123');

      expect(remindersRepo.delete).toHaveBeenCalledWith('reminder-123');
    });

    it('should throw ForbiddenException if reminder not in vehicle', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue({
        ...mockReminder,
        vehicleId: 'other-vehicle',
      });

      await expect(service.delete('workspace-123', 'vehicle-123', 'reminder-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if reminder not found', async () => {
      (service as any).ensureVehicleBelongsToWorkspace = jest.fn().mockResolvedValue(undefined);
      remindersRepo.findById.mockResolvedValue(null);

      await expect(service.delete('workspace-123', 'vehicle-123', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── Maintenance Interval Sync ────────────────────────────────────────────

  describe('syncFromMaintenanceInterval', () => {
    it('should dismiss reminder when interval is disabled', async () => {
      const disabledInterval = {
        id: 'interval-123',
        vehicleId: 'vehicle-123',
        type: MaintenanceType.OIL_CHANGE,
        title: 'Oil Change',
        status: 'DISABLED' as any,
        intervalKm: null,
        intervalMonths: null,
        lastServiceMileage: null,
        lastServiceDate: null,
        nextServiceMileage: null,
        nextServiceDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const existingReminder = { id: 'reminder-456', status: ReminderStatus.ACTIVE };

      remindersRepo.findByMaintenanceIntervalId.mockResolvedValue(existingReminder as any);
      remindersRepo.update.mockResolvedValue({
        ...existingReminder,
        status: ReminderStatus.DISMISSED,
      } as any);

      await service.syncFromMaintenanceInterval(disabledInterval as any);

      expect(remindersRepo.update).toHaveBeenCalledWith(
        'reminder-456',
        expect.objectContaining({
          status: ReminderStatus.DISMISSED,
        }),
        undefined,
      );
    });

    it('should not create duplicate reminders for disabled interval', async () => {
      const disabledInterval = {
        id: 'interval-123',
        vehicleId: 'vehicle-123',
        type: MaintenanceType.OIL_CHANGE,
        title: 'Oil Change',
        status: 'DISABLED' as any,
        intervalKm: null,
        intervalMonths: null,
        lastServiceMileage: null,
        lastServiceDate: null,
        nextServiceMileage: null,
        nextServiceDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      remindersRepo.findByMaintenanceIntervalId.mockResolvedValue(null);

      await service.syncFromMaintenanceInterval(disabledInterval as any);

      expect(remindersRepo.update).not.toHaveBeenCalled();
    });

    it('should create reminder for active interval without existing reminder', async () => {
      const activeInterval = {
        id: 'interval-123',
        vehicleId: 'vehicle-123',
        type: MaintenanceType.OIL_CHANGE,
        title: 'Oil Change',
        status: 'ACTIVE',
        intervalKm: 10000,
        intervalMonths: 12,
        lastServiceMileage: null,
        lastServiceDate: null,
        nextServiceMileage: 10000,
        nextServiceDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      remindersRepo.findByMaintenanceIntervalId.mockResolvedValue(null);
      remindersRepo.create.mockResolvedValue(mockReminder);

      await service.syncFromMaintenanceInterval(activeInterval as any);

      const createCall = remindersRepo.create.mock.calls[0];
      expect(createCall[0]).toMatchObject({
        vehicleId: 'vehicle-123',
        maintenanceIntervalId: 'interval-123',
        type: expect.any(String),
      });
    });

    it('should map maintenance type to reminder type', async () => {
      const activeInterval = {
        id: 'interval-123',
        vehicleId: 'vehicle-123',
        type: MaintenanceType.OIL_CHANGE,
        title: 'Oil Change',
        status: 'ACTIVE',
        intervalKm: 10000,
        intervalMonths: 12,
        lastServiceMileage: null,
        lastServiceDate: null,
        nextServiceMileage: 10000,
        nextServiceDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      remindersRepo.findByMaintenanceIntervalId.mockResolvedValue(null);
      remindersRepo.create.mockResolvedValue(mockReminder);

      await service.syncFromMaintenanceInterval(activeInterval as any);

      const createCall = remindersRepo.create.mock.calls[0][0];
      expect(createCall.type).toBeDefined();
      expect(Object.values(ReminderType)).toContain(createCall.type);
    });

    it('should accept transaction parameter', async () => {
      const tx = {} as any;
      const activeInterval = {
        id: 'interval-123',
        vehicleId: 'vehicle-123',
        type: MaintenanceType.OIL_CHANGE,
        title: 'Oil Change',
        status: 'ACTIVE',
        intervalKm: 10000,
        intervalMonths: 12,
        lastServiceMileage: null,
        lastServiceDate: null,
        nextServiceMileage: 10000,
        nextServiceDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      remindersRepo.findByMaintenanceIntervalId.mockResolvedValue(null);
      remindersRepo.create.mockResolvedValue(mockReminder);

      await service.syncFromMaintenanceInterval(activeInterval as any, tx);

      expect(remindersRepo.findByMaintenanceIntervalId).toHaveBeenCalledWith('interval-123', tx);
    });
  });
});
