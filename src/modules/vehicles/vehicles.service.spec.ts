import { ForbiddenException, NotFoundException } from '@common/exceptions';
import { AiService } from '@modules/ai';
import { MaintenanceService } from '@modules/maintenance';
import { MilestonesService } from '@modules/milestones';
import { RemindersService } from '@modules/reminders';
import { TimelineService } from '@modules/timeline';
import { TiresService } from '@modules/tires';
import { Test, TestingModule } from '@nestjs/testing';
import { BodyType, DriveType, FuelType, Transmission } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateVehicleDto, UpdateVehicleDto, UpdateVehicleSpecsDto } from './dto';
import { VehiclesRepo } from './vehicles.repository';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehiclesRepo: jest.Mocked<VehiclesRepo>;
  let aiService: jest.Mocked<AiService>;
  let prisma: jest.Mocked<PrismaService>;

  const mockVehicle = {
    id: 'vehicle-123',
    workspaceId: 'workspace-123',
    ownerId: 'user-123',
    brand: 'Toyota',
    model: 'Camry',
    year: 2020,
    generation: '8',
    vin: 'VIN123456',
    plateNumber: 'ABC-123',
    currentMileage: 50000,
    registrationMileage: 0,
    fuelType: [FuelType.PETROL],
    engineDisplacementCc: 2500,
    color: 'Silver',
    transmission: Transmission.AUTOMATIC,
    driveType: DriveType.FWD,
    bodyType: BodyType.SEDAN,
    nickname: null,
    purchaseInfo: null,
    saleInfo: null,
    specs: {
      fuelTankCapacity: 70,
      enginePowerHp: 203,
      torqueNm: 184,
      accelerationSec: 9.2,
      topSpeedKmh: 180,
    },
    primaryPhotoId: null,
    description: null,
    countryOfOrigin: null,
    status: 'ACTIVE',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVehicleWithOwner = {
    ...mockVehicle,
    owner: {
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: VehiclesRepo,
          useValue: {
            findById: jest.fn(),
            findAllByWorkspaceId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: AiService,
          useValue: {
            fillVehicleSpecs: jest.fn(),
          },
        },
        {
          provide: TimelineService,
          useValue: {
            softDeleteAllByVehicleId: jest.fn(),
            deleteAllMileageLogsByVehicleId: jest.fn(),
          },
        },
        {
          provide: RemindersService,
          useValue: {
            deleteAllByVehicleId: jest.fn(),
          },
        },
        {
          provide: MaintenanceService,
          useValue: {
            deleteAllByVehicleId: jest.fn(),
          },
        },
        {
          provide: TiresService,
          useValue: {
            deleteAllByVehicleId: jest.fn(),
          },
        },
        {
          provide: MilestonesService,
          useValue: {
            deleteAllByVehicleId: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    vehiclesRepo = module.get(VehiclesRepo) as jest.Mocked<VehiclesRepo>;
    aiService = module.get(AiService) as jest.Mocked<AiService>;
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('should return vehicle with owner by id', async () => {
      vehiclesRepo.findById.mockResolvedValue(mockVehicleWithOwner as any);

      const result = await service.getById('vehicle-123');

      expect(result).toEqual(mockVehicleWithOwner);
      expect(vehiclesRepo.findById).toHaveBeenCalledWith('vehicle-123');
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehiclesRepo.findById.mockResolvedValue(null);

      await expect(service.getById('invalid-id')).rejects.toThrow(NotFoundException);
      expect(vehiclesRepo.findById).toHaveBeenCalledWith('invalid-id');
    });
  });

  describe('getAllByWorkspaceId', () => {
    it('should return all vehicles in workspace', async () => {
      const vehicles = [mockVehicle, { ...mockVehicle, id: 'vehicle-2', brand: 'Honda' }];
      vehiclesRepo.findAllByWorkspaceId.mockResolvedValue(vehicles as any);

      const result = await service.getAllByWorkspaceId('workspace-123');

      expect(result).toHaveLength(2);
      expect(vehiclesRepo.findAllByWorkspaceId).toHaveBeenCalledWith('workspace-123');
    });

    it('should return empty array when workspace has no vehicles', async () => {
      vehiclesRepo.findAllByWorkspaceId.mockResolvedValue([]);

      const result = await service.getAllByWorkspaceId('workspace-456');

      expect(result).toEqual([]);
    });
  });

  // ─── Commands ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create vehicle with default mileage if not provided', async () => {
      const createDto: CreateVehicleDto = {
        brand: 'Toyota',
        model: 'Camry',
        year: 2020,
        generation: '8',
        vin: 'VIN123456',
        plateNumber: 'ABC-123',
        fuelType: [FuelType.PETROL],
        bodyType: BodyType.SEDAN,
        transmission: Transmission.AUTOMATIC,
        driveType: DriveType.FWD,
        engineDisplacementCc: 2500,
        color: 'Silver',
      };

      vehiclesRepo.create.mockResolvedValue(mockVehicle as any);

      const result = await service.create('user-123', 'workspace-123', createDto);

      expect(result).toBeDefined();
      expect(vehiclesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-123',
          workspaceId: 'workspace-123',
          currentMileage: 0,
          registrationMileage: 0,
        }),
      );
    });

    it('should create vehicle with provided mileage', async () => {
      const createDto: CreateVehicleDto = {
        brand: 'Toyota',
        model: 'Camry',
        year: 2020,
        generation: '8',
        vin: 'VIN123456',
        plateNumber: 'ABC-123',
        currentMileage: 100000,
        fuelType: [FuelType.PETROL],
        bodyType: BodyType.SEDAN,
        transmission: Transmission.AUTOMATIC,
        driveType: DriveType.FWD,
        engineDisplacementCc: 2500,
        color: 'Silver',
      };

      vehiclesRepo.create.mockResolvedValue({
        ...mockVehicle,
        currentMileage: 100000,
        registrationMileage: 100000,
      } as any);

      const result = await service.create('user-123', 'workspace-123', createDto);

      expect(vehiclesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currentMileage: 100000,
          registrationMileage: 100000,
        }),
      );
    });

    it('should return vehicle response DTO', async () => {
      const createDto: CreateVehicleDto = {
        brand: 'Toyota',
        model: 'Camry',
        year: 2020,
        generation: '8',
        vin: 'VIN123456',
        plateNumber: 'ABC-123',
        fuelType: [FuelType.PETROL],
        bodyType: BodyType.SEDAN,
        transmission: Transmission.AUTOMATIC,
        driveType: DriveType.FWD,
        engineDisplacementCc: 2500,
        color: 'Silver',
      };

      vehiclesRepo.create.mockResolvedValue(mockVehicle as any);

      const result = await service.create('user-123', 'workspace-123', createDto);

      expect(result).toBeInstanceOf(Object);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('brand');
    });
  });

  describe('update', () => {
    it('should update vehicle in same workspace', async () => {
      const updateDto: UpdateVehicleDto = { currentMileage: 60000 };

      vehiclesRepo.findById.mockResolvedValue(mockVehicleWithOwner as any);
      vehiclesRepo.update.mockResolvedValue({
        ...mockVehicle,
        currentMileage: 60000,
      } as any);

      const result = await service.update('workspace-123', 'vehicle-123', updateDto);

      expect(result).toBeDefined();
      expect(vehiclesRepo.update).toHaveBeenCalledWith('vehicle-123', updateDto);
    });

    it('should throw ForbiddenException if vehicle in different workspace', async () => {
      const updateDto: UpdateVehicleDto = { currentMileage: 60000 };

      vehiclesRepo.findById.mockResolvedValue({
        ...mockVehicleWithOwner,
        workspaceId: 'other-workspace',
      } as any);

      await expect(service.update('workspace-123', 'vehicle-123', updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      const updateDto: UpdateVehicleDto = { currentMileage: 60000 };

      vehiclesRepo.findById.mockResolvedValue(null);

      await expect(service.update('workspace-123', 'invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSpecs', () => {
    it('should update vehicle specs', async () => {
      const updateDto: UpdateVehicleSpecsDto = {
        fuelTankCapacity: 75,
        enginePowerHp: 210,
        torqueNm: 190,
      };

      vehiclesRepo.findById.mockResolvedValue(mockVehicleWithOwner as any);
      vehiclesRepo.update.mockResolvedValue({
        ...mockVehicle,
        specs: updateDto,
      } as any);

      const result = await service.updateSpecs('workspace-123', 'vehicle-123', updateDto);

      expect(result).toBeDefined();
      expect(vehiclesRepo.update).toHaveBeenCalledWith('vehicle-123', {
        specs: updateDto,
      });
    });

    it('should throw ForbiddenException if vehicle in different workspace', async () => {
      const updateDto: UpdateVehicleSpecsDto = { fuelTankCapacity: 75 };

      vehiclesRepo.findById.mockResolvedValue({
        ...mockVehicleWithOwner,
        workspaceId: 'other-workspace',
      } as any);

      await expect(service.updateSpecs('workspace-123', 'vehicle-123', updateDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should soft delete vehicle and cascade child data', async () => {
      vehiclesRepo.findById.mockResolvedValue(mockVehicleWithOwner as any);
      prisma.$transaction.mockImplementation((callback) => callback({} as any));

      await service.delete('workspace-123', 'vehicle-123');

      expect(vehiclesRepo.softDelete).toHaveBeenCalledWith('vehicle-123', expect.anything());
    });

    it('should throw ForbiddenException if vehicle in different workspace', async () => {
      vehiclesRepo.findById.mockResolvedValue({
        ...mockVehicleWithOwner,
        workspaceId: 'other-workspace',
      } as any);

      await expect(service.delete('workspace-123', 'vehicle-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehiclesRepo.findById.mockResolvedValue(null);

      await expect(service.delete('workspace-123', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── AI Operations ────────────────────────────────────────────────────────

  describe('fillSpecsWithAi', () => {
    it('should fill vehicle specs using AI service', async () => {
      const aiSpecs = {
        fuelTankCapacity: 70,
        enginePower: 203,
        torque: 184,
        acceleration: 9.2,
        topSpeed: 180,
      };

      vehiclesRepo.findById.mockResolvedValue(mockVehicleWithOwner as any);
      aiService.fillVehicleSpecs.mockResolvedValue(aiSpecs as any);
      vehiclesRepo.update.mockResolvedValue({
        ...mockVehicle,
        specs: aiSpecs,
      } as any);

      const result = await service.fillSpecsWithAi('workspace-123', 'vehicle-123');

      expect(result).toBeDefined();
      expect(aiService.fillVehicleSpecs).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: 'Toyota',
          model: 'Camry',
          year: 2020,
        }),
      );
      expect(vehiclesRepo.update).toHaveBeenCalledWith('vehicle-123', {
        specs: aiSpecs,
      });
    });

    it('should include engine displacement in AI request', async () => {
      vehiclesRepo.findById.mockResolvedValue(mockVehicleWithOwner as any);
      aiService.fillVehicleSpecs.mockResolvedValue({} as any);
      vehiclesRepo.update.mockResolvedValue(mockVehicle as any);

      await service.fillSpecsWithAi('workspace-123', 'vehicle-123');

      expect(aiService.fillVehicleSpecs).toHaveBeenCalledWith(
        expect.objectContaining({
          engineDisplacementCc: 2500,
        }),
      );
    });

    it('should throw ForbiddenException if vehicle in different workspace', async () => {
      vehiclesRepo.findById.mockResolvedValue({
        ...mockVehicleWithOwner,
        workspaceId: 'other-workspace',
      } as any);

      await expect(service.fillSpecsWithAi('workspace-123', 'vehicle-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehiclesRepo.findById.mockResolvedValue(null);

      await expect(service.fillSpecsWithAi('workspace-123', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle AI service errors gracefully', async () => {
      vehiclesRepo.findById.mockResolvedValue(mockVehicleWithOwner as any);
      aiService.fillVehicleSpecs.mockRejectedValue(new Error('AI service error'));

      await expect(service.fillSpecsWithAi('workspace-123', 'vehicle-123')).rejects.toThrow(
        'AI service error',
      );
    });
  });
});
