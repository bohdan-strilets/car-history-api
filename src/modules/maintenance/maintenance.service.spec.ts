import { ForbiddenException, NotFoundException } from '@common/exceptions';
import { RemindersService } from '@modules/reminders';
import { TimelineService } from '@modules/timeline';
import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceInterval, MaintenanceStatus, MaintenanceType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dto';
import { MaintenanceRepository } from './maintenance.repository';
import { MaintenanceService } from './maintenance.service';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let maintenanceRepo: jest.Mocked<MaintenanceRepository>;
  let remindersService: jest.Mocked<RemindersService>;
  let timelineService: jest.Mocked<TimelineService>;

  const mockInterval = {
    id: 'interval-123',
    vehicleId: 'vehicle-123',
    type: MaintenanceType.OIL_CHANGE,
    title: 'Oil Change',
    intervalKm: 10000,
    intervalMonths: 12,
    lastServiceMileage: 40000,
    lastServiceDate: new Date('2026-01-15'),
    nextServiceMileage: 50000,
    nextServiceDate: new Date('2027-01-15'),
    status: MaintenanceStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as MaintenanceInterval;

  const fakeTx = {} as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        {
          provide: MaintenanceRepository,
          useValue: {
            findAllByVehicleId: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: RemindersService,
          useValue: {
            syncFromMaintenanceInterval: jest.fn(),
            deleteByMaintenanceIntervalId: jest.fn(),
          },
        },
        {
          provide: TimelineService,
          useValue: {
            createMaintenanceServiceEvent: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((callback) => callback(fakeTx)),
          },
        },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    maintenanceRepo = module.get(MaintenanceRepository) as jest.Mocked<MaintenanceRepository>;
    remindersService = module.get(RemindersService) as jest.Mocked<RemindersService>;
    timelineService = module.get(TimelineService) as jest.Mocked<TimelineService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  describe('getAllByVehicleId', () => {
    it('should return all intervals for vehicle', async () => {
      maintenanceRepo.findAllByVehicleId.mockResolvedValue([mockInterval]);

      const result = await service.getAllByVehicleId('vehicle-123');

      expect(result).toHaveLength(1);
      expect(maintenanceRepo.findAllByVehicleId).toHaveBeenCalledWith('vehicle-123');
    });

    it('should return empty array when vehicle has no intervals', async () => {
      maintenanceRepo.findAllByVehicleId.mockResolvedValue([]);

      const result = await service.getAllByVehicleId('vehicle-456');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return interval by id', async () => {
      maintenanceRepo.findById.mockResolvedValue(mockInterval);

      const result = await service.getById('interval-123');

      expect(result).toEqual(mockInterval);
    });

    it('should throw NotFoundException if interval not found', async () => {
      maintenanceRepo.findById.mockResolvedValue(null);

      await expect(service.getById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Commands ─────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create interval and sync reminder', async () => {
      const createDto: CreateMaintenanceDto = {
        type: MaintenanceType.OIL_CHANGE,
        title: 'Oil Change',
        intervalKm: 10000,
        intervalMonths: 12,
      };

      maintenanceRepo.create.mockResolvedValue(mockInterval);

      const result = await service.create('vehicle-123', createDto);

      expect(result).toBeDefined();
      expect(maintenanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'vehicle-123',
          type: MaintenanceType.OIL_CHANGE,
          title: 'Oil Change',
        }),
        fakeTx,
      );
      expect(remindersService.syncFromMaintenanceInterval).toHaveBeenCalledWith(
        mockInterval,
        fakeTx,
      );
    });

    it('should calculate nextServiceMileage from lastServiceMileage + intervalKm', async () => {
      const createDto: CreateMaintenanceDto = {
        type: MaintenanceType.OIL_CHANGE,
        title: 'Oil Change',
        intervalKm: 10000,
        lastServiceMileage: 40000,
      };

      maintenanceRepo.create.mockResolvedValue(mockInterval);

      await service.create('vehicle-123', createDto);

      expect(maintenanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ nextServiceMileage: 50000 }),
        fakeTx,
      );
    });

    it('should leave nextServiceMileage null when intervalKm not provided', async () => {
      const createDto: CreateMaintenanceDto = {
        type: MaintenanceType.CUSTOM,
        title: 'Custom check',
      };

      maintenanceRepo.create.mockResolvedValue(mockInterval);

      await service.create('vehicle-123', createDto);

      expect(maintenanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ nextServiceMileage: null, nextServiceDate: null }),
        fakeTx,
      );
    });
  });

  describe('update', () => {
    it('should update interval and sync reminder', async () => {
      const updateDto: UpdateMaintenanceDto = { title: 'Oil Change Updated' };

      maintenanceRepo.findById.mockResolvedValue(mockInterval);
      maintenanceRepo.update.mockResolvedValue({ ...mockInterval, title: 'Oil Change Updated' });

      const result = await service.update('vehicle-123', 'interval-123', updateDto);

      expect(result).toBeDefined();
      expect(maintenanceRepo.update).toHaveBeenCalledWith(
        'interval-123',
        expect.objectContaining({ title: 'Oil Change Updated' }),
        fakeTx,
      );
      expect(remindersService.syncFromMaintenanceInterval).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if interval not in vehicle', async () => {
      maintenanceRepo.findById.mockResolvedValue({ ...mockInterval, vehicleId: 'other-vehicle' });

      await expect(service.update('vehicle-123', 'interval-123', { title: 'X' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if interval not found', async () => {
      maintenanceRepo.findById.mockResolvedValue(null);

      await expect(service.update('vehicle-123', 'invalid-id', { title: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should keep existing values when dto fields are omitted', async () => {
      maintenanceRepo.findById.mockResolvedValue(mockInterval);
      maintenanceRepo.update.mockResolvedValue(mockInterval);

      await service.update('vehicle-123', 'interval-123', {});

      expect(maintenanceRepo.update).toHaveBeenCalledWith(
        'interval-123',
        expect.objectContaining({
          intervalKm: mockInterval.intervalKm,
          intervalMonths: mockInterval.intervalMonths,
        }),
        fakeTx,
      );
    });
  });

  describe('disable', () => {
    it('should disable an active interval', async () => {
      maintenanceRepo.findById.mockResolvedValue(mockInterval);
      maintenanceRepo.update.mockResolvedValue({
        ...mockInterval,
        status: MaintenanceStatus.DISABLED,
      });

      const result = await service.disable('vehicle-123', 'interval-123');

      expect(result).toBeDefined();
      expect(maintenanceRepo.update).toHaveBeenCalledWith(
        'interval-123',
        { status: MaintenanceStatus.DISABLED },
        fakeTx,
      );
    });

    it('should throw ForbiddenException if already disabled', async () => {
      maintenanceRepo.findById.mockResolvedValue({
        ...mockInterval,
        status: MaintenanceStatus.DISABLED,
      });

      await expect(service.disable('vehicle-123', 'interval-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if interval not in vehicle', async () => {
      maintenanceRepo.findById.mockResolvedValue({ ...mockInterval, vehicleId: 'other-vehicle' });

      await expect(service.disable('vehicle-123', 'interval-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('enable', () => {
    it('should enable a disabled interval', async () => {
      maintenanceRepo.findById.mockResolvedValue({
        ...mockInterval,
        status: MaintenanceStatus.DISABLED,
      });
      maintenanceRepo.update.mockResolvedValue({
        ...mockInterval,
        status: MaintenanceStatus.ACTIVE,
      });

      const result = await service.enable('vehicle-123', 'interval-123');

      expect(result).toBeDefined();
      expect(maintenanceRepo.update).toHaveBeenCalledWith(
        'interval-123',
        { status: MaintenanceStatus.ACTIVE },
        fakeTx,
      );
    });

    it('should throw ForbiddenException if interval not in vehicle', async () => {
      maintenanceRepo.findById.mockResolvedValue({ ...mockInterval, vehicleId: 'other-vehicle' });

      await expect(service.enable('vehicle-123', 'interval-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should delete interval and its synced reminder', async () => {
      maintenanceRepo.findById.mockResolvedValue(mockInterval);

      await service.delete('vehicle-123', 'interval-123');

      expect(remindersService.deleteByMaintenanceIntervalId).toHaveBeenCalledWith(
        'interval-123',
        fakeTx,
      );
      expect(maintenanceRepo.delete).toHaveBeenCalledWith('interval-123', fakeTx);
    });

    it('should throw ForbiddenException if interval not in vehicle', async () => {
      maintenanceRepo.findById.mockResolvedValue({ ...mockInterval, vehicleId: 'other-vehicle' });

      await expect(service.delete('vehicle-123', 'interval-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if interval not found', async () => {
      maintenanceRepo.findById.mockResolvedValue(null);

      await expect(service.delete('vehicle-123', 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsDone', () => {
    const markDoneDto = { mileage: 50500, date: new Date('2026-06-15') };

    it('should update interval, create timeline service event, and sync reminder', async () => {
      maintenanceRepo.findById.mockResolvedValue(mockInterval);
      maintenanceRepo.update.mockResolvedValue({
        ...mockInterval,
        lastServiceMileage: markDoneDto.mileage,
        lastServiceDate: markDoneDto.date,
      });

      const result = await service.markAsDone('vehicle-123', 'interval-123', markDoneDto);

      expect(result).toBeDefined();
      expect(maintenanceRepo.update).toHaveBeenCalledWith(
        'interval-123',
        expect.objectContaining({
          lastServiceMileage: markDoneDto.mileage,
          lastServiceDate: markDoneDto.date,
          status: MaintenanceStatus.ACTIVE,
        }),
        fakeTx,
      );
      expect(timelineService.createMaintenanceServiceEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'vehicle-123',
          maintenanceIntervalId: 'interval-123',
          title: mockInterval.title,
          mileage: markDoneDto.mileage,
          eventDate: markDoneDto.date,
        }),
        fakeTx,
      );
      expect(remindersService.syncFromMaintenanceInterval).toHaveBeenCalled();
    });

    it('should re-enable a disabled interval when marked done', async () => {
      maintenanceRepo.findById.mockResolvedValue({
        ...mockInterval,
        status: MaintenanceStatus.DISABLED,
      });
      maintenanceRepo.update.mockResolvedValue({
        ...mockInterval,
        status: MaintenanceStatus.ACTIVE,
      });

      await service.markAsDone('vehicle-123', 'interval-123', markDoneDto);

      expect(maintenanceRepo.update).toHaveBeenCalledWith(
        'interval-123',
        expect.objectContaining({ status: MaintenanceStatus.ACTIVE }),
        fakeTx,
      );
    });

    it('should calculate nextServiceMileage from provided mileage + intervalKm', async () => {
      maintenanceRepo.findById.mockResolvedValue(mockInterval); // intervalKm: 10000
      maintenanceRepo.update.mockResolvedValue(mockInterval);

      await service.markAsDone('vehicle-123', 'interval-123', markDoneDto);

      expect(maintenanceRepo.update).toHaveBeenCalledWith(
        'interval-123',
        expect.objectContaining({ nextServiceMileage: 60500 }),
        fakeTx,
      );
    });

    it('should throw ForbiddenException if interval not in vehicle', async () => {
      maintenanceRepo.findById.mockResolvedValue({ ...mockInterval, vehicleId: 'other-vehicle' });

      await expect(service.markAsDone('vehicle-123', 'interval-123', markDoneDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if interval not found', async () => {
      maintenanceRepo.findById.mockResolvedValue(null);

      await expect(service.markAsDone('vehicle-123', 'invalid-id', markDoneDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
