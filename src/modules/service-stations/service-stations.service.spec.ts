import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceStation, ServiceStationType } from '@prisma/client';

import { CreateServiceStationDto, UpdateServiceStationDto } from './dto';
import { ServiceStationsRepository } from './service-stations.repository';
import { ServiceStationsService } from './service-stations.service';

describe('ServiceStationsService', () => {
  let service: ServiceStationsService;
  let repo: jest.Mocked<ServiceStationsRepository>;

  const mockStation: ServiceStation = {
    id: 'station-123',
    userId: 'user-123',
    name: 'Warsztat Kowalski',
    type: ServiceStationType.MECHANIC,
    address: { country: 'Polska', city: 'Warszawa', street: 'Marszałkowska', number: '10' },
    latitude: null,
    longitude: null,
    phone: null,
    website: null,
    notes: null,
    isFavorite: false,
    lastVisitedAt: null,
    visitCount: 0,
    myRating: null,
    googlePlaceId: null,
    googleRating: null,
    photoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ServiceStation;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceStationsService,
        {
          provide: ServiceStationsRepository,
          useValue: {
            findAllByUserId: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            toggleFavorite: jest.fn(),
            recalculateVisitStats: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceStationsService>(ServiceStationsService);
    repo = module.get(ServiceStationsRepository) as jest.Mocked<ServiceStationsRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  describe('getAllByUserId', () => {
    it('should return all stations for user', async () => {
      repo.findAllByUserId.mockResolvedValue([mockStation]);

      const result = await service.getAllByUserId('user-123');

      expect(result).toHaveLength(1);
      expect(repo.findAllByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array when user has no stations', async () => {
      repo.findAllByUserId.mockResolvedValue([]);

      const result = await service.getAllByUserId('user-456');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return station by id when owned by user', async () => {
      repo.findById.mockResolvedValue(mockStation);

      const result = await service.getById('user-123', 'station-123');

      expect(result.id).toBe('station-123');
    });

    it('should throw NotFoundException if station not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getById('user-123', 'invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if station belongs to another user', async () => {
      repo.findById.mockResolvedValue({ ...mockStation, userId: 'other-user' });

      await expect(service.getById('user-123', 'station-123')).rejects.toMatchObject({
        errorCode: ErrorCodes.ServiceStation.ACCESS_DENIED,
      });
    });
  });

  // ─── Create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create station with provided fields', async () => {
      const dto: CreateServiceStationDto = {
        name: 'Warsztat Kowalski',
        type: ServiceStationType.MECHANIC,
        address: {
          country: 'Polska',
          city: 'Warszawa',
          street: 'Marszałkowska',
          number: '10',
        },
      };

      repo.create.mockResolvedValue(mockStation);

      await service.create('user-123', dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          name: 'Warsztat Kowalski',
          type: ServiceStationType.MECHANIC,
        }),
      );
    });

    it('should default optional fields to null', async () => {
      const dto: CreateServiceStationDto = {
        name: 'Warsztat Kowalski',
        type: ServiceStationType.MECHANIC,
        address: {
          country: 'Polska',
          city: 'Warszawa',
          street: 'Marszałkowska',
          number: '10',
        },
      };

      repo.create.mockResolvedValue(mockStation);

      await service.create('user-123', dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: null,
          longitude: null,
          phone: null,
          website: null,
          notes: null,
          googlePlaceId: null,
          googleRating: null,
        }),
      );
    });
  });

  // ─── Update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update station when owned by user', async () => {
      const dto: UpdateServiceStationDto = { name: 'Updated Name' };

      repo.findById.mockResolvedValue(mockStation);
      repo.update.mockResolvedValue({ ...mockStation, name: 'Updated Name' });

      const result = await service.update('user-123', 'station-123', dto);

      expect(result.name).toBe('Updated Name');
      expect(repo.update).toHaveBeenCalledWith(
        'station-123',
        expect.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should throw ForbiddenException if station belongs to another user', async () => {
      repo.findById.mockResolvedValue({ ...mockStation, userId: 'other-user' });

      await expect(service.update('user-123', 'station-123', { name: 'X' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if station not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.update('user-123', 'invalid-id', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── toggleFavorite ───────────────────────────────────────────────────────

  describe('toggleFavorite', () => {
    it('should flip isFavorite from false to true', async () => {
      repo.findById.mockResolvedValue(mockStation);
      repo.toggleFavorite.mockResolvedValue({ ...mockStation, isFavorite: true });

      const result = await service.toggleFavorite('user-123', 'station-123');

      expect(result.isFavorite).toBe(true);
      expect(repo.toggleFavorite).toHaveBeenCalledWith('station-123', true);
    });

    it('should flip isFavorite from true to false', async () => {
      repo.findById.mockResolvedValue({ ...mockStation, isFavorite: true });
      repo.toggleFavorite.mockResolvedValue({ ...mockStation, isFavorite: false });

      await service.toggleFavorite('user-123', 'station-123');

      expect(repo.toggleFavorite).toHaveBeenCalledWith('station-123', false);
    });

    it('should throw ForbiddenException if station belongs to another user', async () => {
      repo.findById.mockResolvedValue({ ...mockStation, userId: 'other-user' });

      await expect(service.toggleFavorite('user-123', 'station-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── Delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete station when owned by user', async () => {
      repo.findById.mockResolvedValue(mockStation);

      await service.delete('user-123', 'station-123');

      expect(repo.delete).toHaveBeenCalledWith('station-123');
    });

    it('should throw ForbiddenException if station belongs to another user', async () => {
      repo.findById.mockResolvedValue({ ...mockStation, userId: 'other-user' });

      await expect(service.delete('user-123', 'station-123')).rejects.toThrow(ForbiddenException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if station not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.delete('user-123', 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── recalculateVisitStats ────────────────────────────────────────────────

  describe('recalculateVisitStats', () => {
    it('should delegate to repository', async () => {
      await service.recalculateVisitStats('station-123');

      expect(repo.recalculateVisitStats).toHaveBeenCalledWith('station-123', undefined);
    });

    it('should pass transaction client through', async () => {
      const tx = {} as any;

      await service.recalculateVisitStats('station-123', tx);

      expect(repo.recalculateVisitStats).toHaveBeenCalledWith('station-123', tx);
    });
  });
});
