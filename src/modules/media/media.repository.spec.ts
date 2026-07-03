import { Test, TestingModule } from '@nestjs/testing';
import { MediaEntity } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { MediaRepository } from './media.repository';

describe('MediaRepository', () => {
  let repository: MediaRepository;
  let prisma: {
    vehicle: { findUnique: jest.Mock };
    tire: { findUnique: jest.Mock };
    service: { findUnique: jest.Mock };
    document: { findUnique: jest.Mock };
    expense: { findUnique: jest.Mock };
    trip: { findUnique: jest.Mock };
    media: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      vehicle: { findUnique: jest.fn() },
      tire: { findUnique: jest.fn() },
      service: { findUnique: jest.fn() },
      document: { findUnique: jest.fn() },
      expense: { findUnique: jest.fn() },
      trip: { findUnique: jest.fn() },
      media: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<MediaRepository>(MediaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── resolveEntityContext ─────────────────────────────────────────────────

  describe('resolveEntityContext', () => {
    it('should return null workspaceId/vehicleId for USER entity', async () => {
      const result = await repository.resolveEntityContext(MediaEntity.USER, 'user-123');

      expect(result).toEqual({ workspaceId: null, vehicleId: null });
    });

    it('should resolve context for VEHICLE entity', async () => {
      prisma.vehicle.findUnique.mockResolvedValue({ id: 'vehicle-1', workspaceId: 'ws-1' });

      const result = await repository.resolveEntityContext(MediaEntity.VEHICLE, 'vehicle-1');

      expect(result).toEqual({ workspaceId: 'ws-1', vehicleId: 'vehicle-1' });
    });

    it('should return null when VEHICLE not found', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      const result = await repository.resolveEntityContext(MediaEntity.VEHICLE, 'invalid-id');

      expect(result).toBeNull();
    });

    it('should resolve context for TIRE entity via vehicle', async () => {
      prisma.tire.findUnique.mockResolvedValue({
        vehicleId: 'vehicle-1',
        vehicle: { workspaceId: 'ws-1' },
      });

      const result = await repository.resolveEntityContext(MediaEntity.TIRE, 'tire-1');

      expect(result).toEqual({ workspaceId: 'ws-1', vehicleId: 'vehicle-1' });
    });

    it('should resolve context for SERVICE entity via timeline event', async () => {
      prisma.service.findUnique.mockResolvedValue({
        event: { vehicleId: 'vehicle-1', vehicle: { workspaceId: 'ws-1' } },
      });

      const result = await repository.resolveEntityContext(MediaEntity.SERVICE, 'service-1');

      expect(result).toEqual({ workspaceId: 'ws-1', vehicleId: 'vehicle-1' });
    });

    it('should resolve context for DOCUMENT entity via timeline event', async () => {
      prisma.document.findUnique.mockResolvedValue({
        event: { vehicleId: 'vehicle-1', vehicle: { workspaceId: 'ws-1' } },
      });

      const result = await repository.resolveEntityContext(MediaEntity.DOCUMENT, 'document-1');

      expect(result).toEqual({ workspaceId: 'ws-1', vehicleId: 'vehicle-1' });
    });

    it('should resolve context for EXPENSE entity via timeline event', async () => {
      prisma.expense.findUnique.mockResolvedValue({
        event: { vehicleId: 'vehicle-1', vehicle: { workspaceId: 'ws-1' } },
      });

      const result = await repository.resolveEntityContext(MediaEntity.EXPENSE, 'expense-1');

      expect(result).toEqual({ workspaceId: 'ws-1', vehicleId: 'vehicle-1' });
    });

    it('should resolve context for TRIP entity via timeline event', async () => {
      prisma.trip.findUnique.mockResolvedValue({
        event: { vehicleId: 'vehicle-1', vehicle: { workspaceId: 'ws-1' } },
      });

      const result = await repository.resolveEntityContext(MediaEntity.TRIP, 'trip-1');

      expect(result).toEqual({ workspaceId: 'ws-1', vehicleId: 'vehicle-1' });
    });

    it('should return null when related entity not found', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      const result = await repository.resolveEntityContext(MediaEntity.SERVICE, 'invalid-id');

      expect(result).toBeNull();
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create media with variants and usage', async () => {
      const input = {
        uploadedBy: 'user-123',
        cloudinaryId: 'public-id',
        cloudinaryUrl: 'https://cloudinary.com/img.jpg',
        type: 'IMAGE' as const,
        mimeType: 'image/jpeg',
        originalName: 'photo.jpg',
        storageKey: 'public-id',
        sizeBytes: 1024,
        width: 800,
        height: 600,
        durationSeconds: null,
        variants: [
          {
            type: 'THUMBNAIL' as const,
            cloudinaryUrl: 'https://cloudinary.com/thumb.jpg',
            storageKey: 'public-id',
            width: 150,
            height: 150,
            sizeBytes: 200,
          },
        ],
        usage: {
          entityType: MediaEntity.VEHICLE,
          entityId: 'vehicle-1',
          category: 'EXTERIOR' as const,
          isPrimary: false,
        },
      };

      prisma.media.create.mockResolvedValue({ id: 'media-123', ...input });

      await repository.create(input);

      expect(prisma.media.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            uploadedBy: 'user-123',
            variants: { create: expect.any(Array) },
            usages: { create: expect.objectContaining({ entityId: 'vehicle-1' }) },
          }),
        }),
      );
    });
  });

  // ─── findByVehicleGallery ─────────────────────────────────────────────────

  describe('findByVehicleGallery', () => {
    it('should query media by vehicle usage', async () => {
      prisma.media.findMany.mockResolvedValue([]);

      await repository.findByVehicleGallery('vehicle-1');

      expect(prisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            usages: {
              some: { entityType: MediaEntity.VEHICLE, entityId: 'vehicle-1' },
            },
          },
        }),
      );
    });

    it('should filter by category when provided', async () => {
      prisma.media.findMany.mockResolvedValue([]);

      await repository.findByVehicleGallery('vehicle-1', 'EXTERIOR' as never);

      expect(prisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            usages: {
              some: {
                entityType: MediaEntity.VEHICLE,
                entityId: 'vehicle-1',
                category: 'EXTERIOR',
              },
            },
          },
        }),
      );
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should delete media by id', async () => {
      await repository.delete('media-123');

      expect(prisma.media.delete).toHaveBeenCalledWith({ where: { id: 'media-123' } });
    });
  });
});
