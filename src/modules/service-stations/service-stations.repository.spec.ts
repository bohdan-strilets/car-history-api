import { ConflictException } from '@common/exceptions';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, ServiceStationType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { ServiceStationsRepository } from './service-stations.repository';

describe('ServiceStationsRepository', () => {
  let repository: ServiceStationsRepository;
  let prisma: {
    serviceStation: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    timelineEvent: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      serviceStation: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      timelineEvent: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceStationsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<ServiceStationsRepository>(ServiceStationsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByUserId', () => {
    it('should query stations ordered by favorite then name', async () => {
      prisma.serviceStation.findMany.mockResolvedValue([]);

      await repository.findAllByUserId('user-123');

      expect(prisma.serviceStation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
      });
    });
  });

  describe('create', () => {
    it('should create station with provided data', async () => {
      prisma.serviceStation.create.mockResolvedValue({});

      await repository.create({
        userId: 'user-123',
        name: 'Warsztat',
        type: ServiceStationType.MECHANIC,
        address: { country: 'Polska', city: 'Warszawa', street: 'Test', number: '1' },
        latitude: null,
        longitude: null,
        phone: null,
        website: null,
        notes: null,
        googlePlaceId: null,
        googleRating: null,
      });

      expect(prisma.serviceStation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-123', name: 'Warsztat' }),
        }),
      );
    });

    it('should throw ConflictException on P2002 unique constraint violation', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.8.0',
      });
      prisma.serviceStation.create.mockRejectedValue(prismaError);

      await expect(
        repository.create({
          userId: 'user-123',
          name: 'Warsztat',
          type: ServiceStationType.MECHANIC,
          address: { country: 'Polska', city: 'Warszawa', street: 'Test', number: '1' },
          latitude: null,
          longitude: null,
          phone: null,
          website: null,
          notes: null,
          googlePlaceId: 'google-place-1',
          googleRating: null,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should rethrow non-P2002 errors', async () => {
      prisma.serviceStation.create.mockRejectedValue(new Error('Unexpected DB error'));

      await expect(
        repository.create({
          userId: 'user-123',
          name: 'Warsztat',
          type: ServiceStationType.MECHANIC,
          address: { country: 'Polska', city: 'Warszawa', street: 'Test', number: '1' },
          latitude: null,
          longitude: null,
          phone: null,
          website: null,
          notes: null,
          googlePlaceId: null,
          googleRating: null,
        }),
      ).rejects.toThrow('Unexpected DB error');
    });
  });

  describe('toggleFavorite', () => {
    it('should update isFavorite field', async () => {
      prisma.serviceStation.update.mockResolvedValue({});

      await repository.toggleFavorite('station-123', true);

      expect(prisma.serviceStation.update).toHaveBeenCalledWith({
        where: { id: 'station-123' },
        data: { isFavorite: true },
      });
    });
  });

  describe('delete', () => {
    it('should delete station by id', async () => {
      await repository.delete('station-123');

      expect(prisma.serviceStation.delete).toHaveBeenCalledWith({ where: { id: 'station-123' } });
    });
  });

  describe('recalculateVisitStats', () => {
    it('should set visitCount and lastVisitedAt from most recent event', async () => {
      const events = [{ eventDate: new Date('2026-06-01') }, { eventDate: new Date('2026-05-01') }];
      prisma.timelineEvent.findMany.mockResolvedValue(events);
      prisma.serviceStation.update.mockResolvedValue({});

      await repository.recalculateVisitStats('station-123');

      expect(prisma.serviceStation.update).toHaveBeenCalledWith({
        where: { id: 'station-123' },
        data: { visitCount: 2, lastVisitedAt: events[0].eventDate },
      });
    });

    it('should set visitCount to 0 and lastVisitedAt to null when no events', async () => {
      prisma.timelineEvent.findMany.mockResolvedValue([]);
      prisma.serviceStation.update.mockResolvedValue({});

      await repository.recalculateVisitStats('station-123');

      expect(prisma.serviceStation.update).toHaveBeenCalledWith({
        where: { id: 'station-123' },
        data: { visitCount: 0, lastVisitedAt: null },
      });
    });

    it('should only count non-deleted events', async () => {
      prisma.timelineEvent.findMany.mockResolvedValue([]);

      await repository.recalculateVisitStats('station-123');

      expect(prisma.timelineEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { serviceStationId: 'station-123', deletedAt: null },
        }),
      );
    });
  });
});
