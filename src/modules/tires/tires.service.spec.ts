import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { Tire, TireChangeType, TireStatus, TireType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateTireDto, UpdateTireDto } from './dto';
import { TiresRepository } from './tires.repository';
import { TiresService } from './tires.service';

describe('TiresService', () => {
  let service: TiresService;
  let tiresRepo: jest.Mocked<TiresRepository>;
  let prisma: {
    $transaction: jest.Mock;
    vehicle: { findUnique: jest.Mock };
    workspaceMember: { findUnique: jest.Mock };
  };

  const mockTire: Tire = {
    id: 'tire-123',
    vehicleId: 'vehicle-123',
    brand: 'Michelin',
    model: 'Pilot Sport 4',
    type: TireType.SUMMER,
    width: 225,
    aspectRatio: 45,
    rimDiameter: 17,
    price: null,
    status: TireStatus.STORED,
    storageLocation: null,
    mileageAtPurchase: null,
    quantity: 4,
    purchaseAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tire;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      vehicle: { findUnique: jest.fn() },
      workspaceMember: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiresService,
        {
          provide: TiresRepository,
          useValue: {
            findAllByVehicleId: jest.fn(),
            findById: jest.fn(),
            findMountedByVehicleId: jest.fn(),
            findTireChangesByTireId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<TiresService>(TiresService);
    tiresRepo = module.get(TiresRepository) as jest.Mocked<TiresRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  describe('getAllByVehicleId', () => {
    it('should return all tires for vehicle', async () => {
      tiresRepo.findAllByVehicleId.mockResolvedValue([mockTire]);

      const result = await service.getAllByVehicleId('vehicle-123');

      expect(result).toHaveLength(1);
      expect(tiresRepo.findAllByVehicleId).toHaveBeenCalledWith('vehicle-123');
    });

    it('should return empty array when vehicle has no tires', async () => {
      tiresRepo.findAllByVehicleId.mockResolvedValue([]);

      const result = await service.getAllByVehicleId('vehicle-456');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return tire by id', async () => {
      tiresRepo.findById.mockResolvedValue(mockTire);

      const result = await service.getById('tire-123');

      expect(result).toEqual(mockTire);
    });

    it('should throw NotFoundException if tire not found', async () => {
      tiresRepo.findById.mockResolvedValue(null);

      await expect(service.getById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create tire with STORED status by default', async () => {
      const dto: CreateTireDto = {
        brand: 'Michelin',
        model: 'Pilot Sport 4',
        type: TireType.SUMMER,
        width: 225,
        aspectRatio: 45,
        rimDiameter: 17,
      };

      tiresRepo.create.mockResolvedValue(mockTire);
      await service.create('vehicle-123', dto, 'user-123');

      expect(tiresRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: 'vehicle-123',
          status: TireStatus.STORED,
          quantity: 4,
        }),
      );
    });

    it('should use provided quantity over default', async () => {
      const dto: CreateTireDto = {
        brand: 'Michelin',
        model: 'Pilot Sport 4',
        type: TireType.SUMMER,
        width: 225,
        aspectRatio: 45,
        rimDiameter: 17,
        quantity: 2,
      };

      tiresRepo.create.mockResolvedValue(mockTire);
      await service.create('vehicle-123', dto, 'user-123');

      expect(tiresRepo.create).toHaveBeenCalledWith(expect.objectContaining({ quantity: 2 }));
    });
  });

  // ─── Update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update tire fields', async () => {
      tiresRepo.findById.mockResolvedValue(mockTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      tiresRepo.update.mockResolvedValue({ ...mockTire, price: '150.00' } as any);

      const dto: UpdateTireDto = { price: 150 };
      await service.update('user-123', 'tire-123', dto);

      expect(tiresRepo.update).toHaveBeenCalledWith(
        'tire-123',
        expect.objectContaining({ price: 150 }),
      );
    });

    it('should throw ForbiddenException if user is not workspace member', async () => {
      tiresRepo.findById.mockResolvedValue(mockTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.update('other-user', 'tire-123', { price: 100 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if tire not found', async () => {
      tiresRepo.findById.mockResolvedValue(null);

      await expect(service.update('user-123', 'invalid-id', { price: 100 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when mounting an already mounted tire', async () => {
      const mountedTire = { ...mockTire, status: TireStatus.MOUNTED };
      tiresRepo.findById.mockResolvedValue(mountedTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await expect(
        service.update('user-123', 'tire-123', { status: TireStatus.MOUNTED }),
      ).rejects.toMatchObject({ errorCode: ErrorCodes.Tire.ALREADY_MOUNTED });
    });

    it('should throw ForbiddenException when retiring an already retired tire', async () => {
      const retiredTire = { ...mockTire, status: TireStatus.RETIRED };
      tiresRepo.findById.mockResolvedValue(retiredTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await expect(
        service.update('user-123', 'tire-123', { status: TireStatus.RETIRED }),
      ).rejects.toMatchObject({ errorCode: ErrorCodes.Tire.ALREADY_RETIRED });
    });

    it('should mount tire via manualMount and demote other mounted tires', async () => {
      const otherMounted = { ...mockTire, id: 'tire-456', status: TireStatus.MOUNTED };
      tiresRepo.findById.mockResolvedValue(mockTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      tiresRepo.findMountedByVehicleId.mockResolvedValue([otherMounted]);
      tiresRepo.update.mockResolvedValue({ ...mockTire, status: TireStatus.MOUNTED });

      prisma.$transaction.mockImplementation(async (callback: any) => callback({}));

      await service.update('user-123', 'tire-123', { status: TireStatus.MOUNTED });

      expect(tiresRepo.update).toHaveBeenCalledWith('tire-456', { status: TireStatus.STORED }, {});
      expect(tiresRepo.update).toHaveBeenCalledWith('tire-123', { status: TireStatus.MOUNTED }, {});
    });
  });

  // ─── Delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete a stored tire', async () => {
      tiresRepo.findById.mockResolvedValue(mockTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'OWNER' });
      await service.delete('user-123', 'tire-123');
      expect(tiresRepo.delete).toHaveBeenCalledWith('tire-123');
    });

    it('should throw ForbiddenException when deleting a mounted tire', async () => {
      const mountedTire = { ...mockTire, status: TireStatus.MOUNTED };
      tiresRepo.findById.mockResolvedValue(mountedTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await expect(service.delete('user-123', 'tire-123')).rejects.toMatchObject({
        errorCode: ErrorCodes.Tire.ALREADY_MOUNTED,
      });
      expect(tiresRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not workspace member', async () => {
      tiresRepo.findById.mockResolvedValue(mockTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.delete('other-user', 'tire-123')).rejects.toThrow(ForbiddenException);
    });

    it('should allow a MEMBER to delete their own tire', async () => {
      tiresRepo.findById.mockResolvedValue({ ...mockTire, createdBy: 'user-123' });
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await service.delete('user-123', 'tire-123');

      expect(tiresRepo.delete).toHaveBeenCalledWith('tire-123');
    });

    it("should throw ForbiddenException when a MEMBER tries to delete someone else's tire", async () => {
      tiresRepo.findById.mockResolvedValue({ ...mockTire, createdBy: 'other-user' });
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1' });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await expect(service.delete('user-123', 'tire-123')).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Timeline integration ─────────────────────────────────────────────────

  describe('mount', () => {
    it('should demote other mounted tires and mount the target', async () => {
      const otherMounted = { ...mockTire, id: 'tire-456', status: TireStatus.MOUNTED };
      tiresRepo.findMountedByVehicleId.mockResolvedValue([otherMounted]);
      const tx = {} as any;

      await service.mount('tire-123', 'vehicle-123', tx);

      expect(tiresRepo.update).toHaveBeenCalledWith('tire-456', { status: TireStatus.STORED }, tx);
      expect(tiresRepo.update).toHaveBeenCalledWith('tire-123', { status: TireStatus.MOUNTED }, tx);
    });

    it('should not demote itself if already the mounted tire', async () => {
      const sameTire = { ...mockTire, id: 'tire-123', status: TireStatus.MOUNTED };
      tiresRepo.findMountedByVehicleId.mockResolvedValue([sameTire]);
      const tx = {} as any;

      await service.mount('tire-123', 'vehicle-123', tx);

      expect(tiresRepo.update).toHaveBeenCalledTimes(1);
      expect(tiresRepo.update).toHaveBeenCalledWith('tire-123', { status: TireStatus.MOUNTED }, tx);
    });
  });

  describe('unmount', () => {
    it('should set tire status to STORED', async () => {
      const tx = {} as any;

      await service.unmount('tire-123', tx);

      expect(tiresRepo.update).toHaveBeenCalledWith('tire-123', { status: TireStatus.STORED }, tx);
    });
  });

  // ─── getHistory ───────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('should return empty history when tire has no changes', async () => {
      tiresRepo.findById.mockResolvedValue(mockTire);
      tiresRepo.findTireChangesByTireId.mockResolvedValue([]);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1', currentMileage: 50000 });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      const result = await service.getHistory('user-123', 'tire-123');

      expect(result.history.periods).toHaveLength(0);
      expect(result.history.totalKmDriven).toBe(0);
      expect(result.history.totalMountCount).toBe(0);
    });

    it('should build a completed period from install + remove pair', async () => {
      tiresRepo.findById.mockResolvedValue(mockTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1', currentMileage: 60000 });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      tiresRepo.findTireChangesByTireId.mockResolvedValue([
        {
          eventDate: new Date('2026-01-01'),
          mileage: 40000,
          changeType: TireChangeType.INSTALL,
          installedMileage: 40000,
          removedMileage: null,
          removedDate: null,
        },
        {
          eventDate: new Date('2026-04-01'),
          mileage: 45000,
          changeType: TireChangeType.REMOVE,
          installedMileage: null,
          removedMileage: 45000,
          removedDate: new Date('2026-04-01'),
        },
      ]);

      const result = await service.getHistory('user-123', 'tire-123');

      expect(result.history.periods).toHaveLength(1);
      expect(result.history.periods[0]).toMatchObject({
        installedMileage: 40000,
        removedMileage: 45000,
        kmDriven: 5000,
        isOngoing: false,
      });
      expect(result.history.totalKmDriven).toBe(5000);
      expect(result.history.totalMountCount).toBe(1);
    });

    it('should build an ongoing period using current vehicle mileage', async () => {
      tiresRepo.findById.mockResolvedValue({ ...mockTire, status: TireStatus.MOUNTED });
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1', currentMileage: 70000 });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      tiresRepo.findTireChangesByTireId.mockResolvedValue([
        {
          eventDate: new Date('2026-01-01'),
          mileage: 60000,
          changeType: TireChangeType.INSTALL,
          installedMileage: 60000,
          removedMileage: null,
          removedDate: null,
        },
      ]);

      const result = await service.getHistory('user-123', 'tire-123');

      expect(result.history.periods).toHaveLength(1);
      expect(result.history.periods[0]).toMatchObject({
        installedMileage: 60000,
        removedAt: null,
        removedMileage: null,
        kmDriven: 10000,
        isOngoing: true,
      });
      expect(result.history.totalKmDriven).toBe(10000);
    });

    it('should handle multiple mount/unmount cycles', async () => {
      tiresRepo.findById.mockResolvedValue(mockTire);
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1', currentMileage: 80000 });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      tiresRepo.findTireChangesByTireId.mockResolvedValue([
        {
          eventDate: new Date('2026-01-01'),
          mileage: 30000,
          changeType: TireChangeType.INSTALL,
          installedMileage: 30000,
          removedMileage: null,
          removedDate: null,
        },
        {
          eventDate: new Date('2026-03-01'),
          mileage: 35000,
          changeType: TireChangeType.REMOVE,
          installedMileage: null,
          removedMileage: 35000,
          removedDate: new Date('2026-03-01'),
        },
        {
          eventDate: new Date('2026-06-01'),
          mileage: 40000,
          changeType: TireChangeType.INSTALL,
          installedMileage: 40000,
          removedMileage: null,
          removedDate: null,
        },
        {
          eventDate: new Date('2026-09-01'),
          mileage: 47000,
          changeType: TireChangeType.REMOVE,
          installedMileage: null,
          removedMileage: 47000,
          removedDate: new Date('2026-09-01'),
        },
      ]);

      const result = await service.getHistory('user-123', 'tire-123');

      expect(result.history.periods).toHaveLength(2);
      expect(result.history.totalMountCount).toBe(2);
      expect(result.history.totalKmDriven).toBe(5000 + 7000);
    });

    it('should still create a period when installedMileage is unknown', async () => {
      tiresRepo.findById.mockResolvedValue({ ...mockTire, status: TireStatus.MOUNTED });
      prisma.vehicle.findUnique.mockResolvedValue({ workspaceId: 'ws-1', currentMileage: 90000 });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      tiresRepo.findTireChangesByTireId.mockResolvedValue([
        {
          eventDate: new Date('2026-01-01'),
          mileage: 85000,
          changeType: TireChangeType.INSTALL,
          installedMileage: null,
          removedMileage: null,
          removedDate: null,
        },
      ]);

      const result = await service.getHistory('user-123', 'tire-123');

      expect(result.history.periods).toHaveLength(1);
      expect(result.history.periods[0]).toMatchObject({
        installedMileage: null,
        kmDriven: null,
        isOngoing: true,
      });
    });

    it('should throw NotFoundException if tire not found', async () => {
      tiresRepo.findById.mockResolvedValue(null);

      await expect(service.getHistory('user-123', 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
