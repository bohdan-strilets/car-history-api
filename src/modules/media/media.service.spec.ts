import { ForbiddenException, NotFoundException } from '@common/exceptions';
import { FileValidatorService, UploadedFile } from '@common/files';
import { AppConfigService } from '@config/config.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MediaCategory, MediaEntity, MediaType, Role } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CloudinaryService } from './cloudinary';
import { UploadMediaDto } from './dto';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepository: jest.Mocked<MediaRepository>;
  let cloudinary: jest.Mocked<CloudinaryService>;
  let fileValidator: jest.Mocked<FileValidatorService>;
  let prisma: {
    workspaceMember: { findUnique: jest.Mock };
    user: { update: jest.Mock };
    vehicle: { update: jest.Mock };
  };

  const mockFile: UploadedFile = {
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('fake'),
  };

  const mockUploadResult = {
    publicId: 'Arvino/workspaces/ws-1/vehicles/vehicle-1/exterior/abc',
    url: 'https://res.cloudinary.com/demo/image/upload/abc.jpg',
    format: 'jpg',
    width: 1200,
    height: 800,
    bytes: 204800,
    resourceType: 'image' as const,
    durationSeconds: null,
    variants: {
      thumbnail: { url: 'https://.../thumb.jpg', width: 150, height: 150, bytes: 5000 },
      small: null,
      medium: null,
      large: null,
    },
  };

  const mockMedia = {
    id: 'media-123',
    uploadedBy: 'user-123',
    cloudinaryId: mockUploadResult.publicId,
    cloudinaryUrl: mockUploadResult.url,
    type: MediaType.IMAGE,
    mimeType: 'image/jpeg',
    originalName: 'photo.jpg',
    storageKey: mockUploadResult.publicId,
    sizeBytes: mockUploadResult.bytes,
    width: 1200,
    height: 800,
    durationSeconds: null,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    variants: [],
    usages: [
      {
        id: 'usage-1',
        mediaId: 'media-123',
        entityType: MediaEntity.VEHICLE,
        entityId: 'vehicle-1',
        category: MediaCategory.EXTERIOR,
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      workspaceMember: { findUnique: jest.fn() },
      user: { update: jest.fn() },
      vehicle: { update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: MediaRepository,
          useValue: {
            resolveEntityContext: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findByVehicleGallery: jest.fn(),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            upload: jest.fn(),
            destroy: jest.fn(),
          },
        },
        {
          provide: FileValidatorService,
          useValue: {
            validate: jest.fn(),
            scan: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            mediaAllowedImageMimeTypes: ['image/jpeg', 'image/png'],
            mediaAllowedVideoMimeTypes: ['video/mp4'],
            mediaMaxFileSizeMb: 20,
          },
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    mediaRepository = module.get(MediaRepository) as jest.Mocked<MediaRepository>;
    cloudinary = module.get(CloudinaryService) as jest.Mocked<CloudinaryService>;
    fileValidator = module.get(FileValidatorService) as jest.Mocked<FileValidatorService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Upload ───────────────────────────────────────────────────────────────

  describe('upload', () => {
    const dto: UploadMediaDto = {
      entityType: MediaEntity.VEHICLE,
      entityId: 'vehicle-1',
      category: MediaCategory.EXTERIOR,
      isPrimary: false,
    };

    it('should validate file before upload', async () => {
      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: 'ws-1',
        vehicleId: 'vehicle-1',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: Role.MEMBER });
      cloudinary.upload.mockResolvedValue(mockUploadResult);
      mediaRepository.create.mockResolvedValue(mockMedia as any);

      await service.upload('user-123', mockFile, dto);

      expect(fileValidator.validate).toHaveBeenCalledWith(mockFile, {
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        maxSizeBytes: 20 * 1024 * 1024,
      });
      expect(fileValidator.scan).toHaveBeenCalledWith(mockFile);
    });

    it('should throw NotFoundException if entity does not exist', async () => {
      mediaRepository.resolveEntityContext.mockResolvedValue(null);

      await expect(service.upload('user-123', mockFile, dto)).rejects.toThrow(NotFoundException);
      expect(cloudinary.upload).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not workspace member', async () => {
      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: 'ws-1',
        vehicleId: 'vehicle-1',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.upload('user-123', mockFile, dto)).rejects.toThrow(ForbiddenException);
      expect(cloudinary.upload).not.toHaveBeenCalled();
    });

    it('should skip access check for USER entity', async () => {
      const avatarDto: UploadMediaDto = {
        entityType: MediaEntity.USER,
        entityId: 'user-123',
        category: MediaCategory.AVATAR,
        isPrimary: true,
      };

      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: null,
        vehicleId: null,
      });
      cloudinary.upload.mockResolvedValue(mockUploadResult);
      mediaRepository.create.mockResolvedValue({
        ...mockMedia,
        usages: [{ ...mockMedia.usages[0], entityType: MediaEntity.USER, entityId: 'user-123' }],
      } as any);

      await service.upload('user-123', mockFile, avatarDto);

      expect(prisma.workspaceMember.findUnique).not.toHaveBeenCalled();
      expect(cloudinary.upload).toHaveBeenCalled();
    });

    it('should call cloudinary upload with resolved folder', async () => {
      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: 'ws-1',
        vehicleId: 'vehicle-1',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: Role.MEMBER });
      cloudinary.upload.mockResolvedValue(mockUploadResult);
      mediaRepository.create.mockResolvedValue(mockMedia as any);

      await service.upload('user-123', mockFile, dto);

      expect(cloudinary.upload).toHaveBeenCalledWith(
        mockFile,
        'Arvino/workspaces/ws-1/vehicles/vehicle-1/exterior',
      );
    });

    it('should create media with variants including original', async () => {
      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: 'ws-1',
        vehicleId: 'vehicle-1',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: Role.MEMBER });
      cloudinary.upload.mockResolvedValue(mockUploadResult);
      mediaRepository.create.mockResolvedValue(mockMedia as any);

      await service.upload('user-123', mockFile, dto);

      const createCall = mediaRepository.create.mock.calls[0][0];
      expect(createCall.variants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'ORIGINAL' }),
          expect.objectContaining({ type: 'THUMBNAIL' }),
        ]),
      );
    });

    it('should sync avatarUrl when USER upload isPrimary', async () => {
      const avatarDto: UploadMediaDto = {
        entityType: MediaEntity.USER,
        entityId: 'user-123',
        category: MediaCategory.AVATAR,
        isPrimary: true,
      };

      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: null,
        vehicleId: null,
      });
      cloudinary.upload.mockResolvedValue(mockUploadResult);
      mediaRepository.create.mockResolvedValue(mockMedia as any);

      await service.upload('user-123', mockFile, avatarDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { avatarUrl: mockUploadResult.url },
      });
    });

    it('should sync primaryPhotoId when VEHICLE upload isPrimary', async () => {
      const primaryDto: UploadMediaDto = { ...dto, isPrimary: true };

      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: 'ws-1',
        vehicleId: 'vehicle-1',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: Role.MEMBER });
      cloudinary.upload.mockResolvedValue(mockUploadResult);
      mediaRepository.create.mockResolvedValue(mockMedia as any);

      await service.upload('user-123', mockFile, primaryDto);

      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
        data: { primaryPhotoId: mockMedia.id },
      });
    });

    it('should not sync primary when isPrimary is false', async () => {
      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: 'ws-1',
        vehicleId: 'vehicle-1',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: Role.MEMBER });
      cloudinary.upload.mockResolvedValue(mockUploadResult);
      mediaRepository.create.mockResolvedValue(mockMedia as any);

      await service.upload('user-123', mockFile, dto);

      expect(prisma.vehicle.update).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── Delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should allow uploader to delete own media', async () => {
      mediaRepository.findById.mockResolvedValue(mockMedia as any);

      await service.delete('user-123', 'media-123');

      expect(cloudinary.destroy).toHaveBeenCalledWith(mockMedia.cloudinaryId, 'image');
      expect(mediaRepository.delete).toHaveBeenCalledWith('media-123');
    });

    it('should allow workspace OWNER to delete others media', async () => {
      mediaRepository.findById.mockResolvedValue(mockMedia as any);
      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: 'ws-1',
        vehicleId: 'vehicle-1',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: Role.OWNER });

      await service.delete('other-user', 'media-123');

      expect(mediaRepository.delete).toHaveBeenCalledWith('media-123');
    });

    it('should throw ForbiddenException if not uploader and not OWNER/ADMIN', async () => {
      mediaRepository.findById.mockResolvedValue(mockMedia as any);
      mediaRepository.resolveEntityContext.mockResolvedValue({
        workspaceId: 'ws-1',
        vehicleId: 'vehicle-1',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue({ role: Role.MEMBER });

      await expect(service.delete('other-user', 'media-123')).rejects.toThrow(ForbiddenException);
      expect(mediaRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if media not found', async () => {
      mediaRepository.findById.mockResolvedValue(null);

      await expect(service.delete('user-123', 'invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should use video resource type when destroying video media', async () => {
      mediaRepository.findById.mockResolvedValue({
        ...mockMedia,
        type: MediaType.VIDEO,
      } as any);

      await service.delete('user-123', 'media-123');

      expect(cloudinary.destroy).toHaveBeenCalledWith(mockMedia.cloudinaryId, 'video');
    });
  });

  // ─── Gallery ──────────────────────────────────────────────────────────────

  describe('getGallery', () => {
    it('should return media for vehicle gallery', async () => {
      mediaRepository.findByVehicleGallery.mockResolvedValue([mockMedia] as any);

      const result = await service.getGallery('vehicle-1');

      expect(result).toHaveLength(1);
      expect(mediaRepository.findByVehicleGallery).toHaveBeenCalledWith('vehicle-1', undefined);
    });

    it('should filter by category when provided', async () => {
      mediaRepository.findByVehicleGallery.mockResolvedValue([mockMedia] as any);

      await service.getGallery('vehicle-1', MediaCategory.EXTERIOR);

      expect(mediaRepository.findByVehicleGallery).toHaveBeenCalledWith(
        'vehicle-1',
        MediaCategory.EXTERIOR,
      );
    });
  });
});
