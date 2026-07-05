import { Test, TestingModule } from '@nestjs/testing';
import { TireStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { TiresRepository } from './tires.repository';

describe('TiresRepository', () => {
  let repository: TiresRepository;
  let prisma: {
    tire: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      tire: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TiresRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<TiresRepository>(TiresRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByVehicleId', () => {
    it('should query tires ordered by status then createdAt desc', async () => {
      prisma.tire.findMany.mockResolvedValue([]);

      await repository.findAllByVehicleId('vehicle-123');

      expect(prisma.tire.findMany).toHaveBeenCalledWith({
        where: { vehicleId: 'vehicle-123' },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findById', () => {
    it('should find tire by id', async () => {
      prisma.tire.findUnique.mockResolvedValue(null);

      await repository.findById('tire-123');

      expect(prisma.tire.findUnique).toHaveBeenCalledWith({ where: { id: 'tire-123' } });
    });
  });

  describe('findMountedByVehicleId', () => {
    it('should query only MOUNTED tires for vehicle', async () => {
      prisma.tire.findMany.mockResolvedValue([]);

      await repository.findMountedByVehicleId('vehicle-123');

      expect(prisma.tire.findMany).toHaveBeenCalledWith({
        where: { vehicleId: 'vehicle-123', status: TireStatus.MOUNTED },
      });
    });
  });

  describe('create', () => {
    it('should create tire with provided fields', async () => {
      prisma.tire.create.mockResolvedValue({});

      await repository.create({
        vehicleId: 'vehicle-123',
        brand: 'Michelin',
        model: 'Pilot Sport 4',
        type: 'SUMMER',
        width: 225,
        aspectRatio: 45,
        rimDiameter: 17,
        price: null,
        status: 'STORED',
        storageLocation: null,
        mileageAtPurchase: null,
        quantity: 4,
        purchaseAt: null,
      });

      expect(prisma.tire.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ vehicleId: 'vehicle-123', quantity: 4 }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update tire by id', async () => {
      prisma.tire.update.mockResolvedValue({});

      await repository.update('tire-123', { price: 100 });

      expect(prisma.tire.update).toHaveBeenCalledWith({
        where: { id: 'tire-123' },
        data: { price: 100 },
      });
    });
  });

  describe('delete', () => {
    it('should delete tire by id', async () => {
      await repository.delete('tire-123');

      expect(prisma.tire.delete).toHaveBeenCalledWith({ where: { id: 'tire-123' } });
    });
  });
});
