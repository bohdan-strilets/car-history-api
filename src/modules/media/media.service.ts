import {
  BadRequestException,
  ErrorCodes,
  ForbiddenException,
  NotFoundException,
} from '@common/exceptions';
import { FileValidatorService, UploadedFile } from '@common/files';
import { AppConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';
import { MediaCategory, MediaEntity, MediaType, Role } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CloudinaryService, CloudinaryUploadResult } from './cloudinary';
import { UploadMediaDto } from './dto';
import { buildCloudinaryFolder } from './lib';
import { mapMedia } from './mappers';
import { MediaRepository } from './media.repository';
import { CreateMediaInput } from './types';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly cloudinary: CloudinaryService,
    private readonly fileValidator: FileValidatorService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async upload(userId: string, file: UploadedFile, dto: UploadMediaDto) {
    const isVideo = file.mimetype.startsWith('video/');

    this.fileValidator.validate(file, {
      allowedMimeTypes: isVideo
        ? this.config.mediaAllowedVideoMimeTypes
        : this.config.mediaAllowedImageMimeTypes,
      maxSizeBytes: this.config.mediaMaxFileSizeMb * 1024 * 1024,
    });
    await this.fileValidator.scan(file);

    const context = await this.mediaRepository.resolveEntityContext(dto.entityType, dto.entityId);
    if (!context) {
      throw new NotFoundException(ErrorCodes.Media.ENTITY_NOT_FOUND);
    }

    await this.assertAccess(userId, dto.entityType, context.workspaceId);

    const folder = buildCloudinaryFolder({
      entityType: dto.entityType,
      entityId: dto.entityId,
      category: dto.category,
      workspaceId: context.workspaceId ?? undefined,
      vehicleId: context.vehicleId ?? undefined,
    });

    const uploadResult = await this.cloudinary.upload(file, folder);

    const input: CreateMediaInput = {
      uploadedBy: userId,
      cloudinaryId: uploadResult.publicId,
      cloudinaryUrl: uploadResult.url,
      type: isVideo ? MediaType.VIDEO : MediaType.IMAGE,
      mimeType: file.mimetype,
      originalName: file.originalname,
      storageKey: uploadResult.publicId,
      sizeBytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      durationSeconds: uploadResult.durationSeconds,
      variants: this.buildVariantsInput(uploadResult),
      usage: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        category: dto.category,
        isPrimary: dto.isPrimary ?? false,
      },
    };

    if (dto.isPrimary) {
      await this.mediaRepository.clearPrimaryForEntity(dto.entityType, dto.entityId);
    }

    const media = await this.mediaRepository.create(input);

    if (dto.isPrimary) {
      await this.syncPrimary(dto.entityType, dto.entityId, media.id, media.cloudinaryUrl);
    }

    return mapMedia(media);
  }

  async delete(userId: string, mediaId: string): Promise<void> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundException(ErrorCodes.Media.NOT_FOUND);
    }

    if (media.uploadedBy !== userId) {
      const usage = media.usages[0];
      const context = usage
        ? await this.mediaRepository.resolveEntityContext(usage.entityType, usage.entityId)
        : null;

      const hasRole = context?.workspaceId
        ? await this.hasWorkspaceRole(userId, context.workspaceId, [Role.OWNER, Role.ADMIN])
        : false;

      if (!hasRole) {
        throw new ForbiddenException(ErrorCodes.Media.ACCESS_DENIED);
      }
    }

    await this.cloudinary.destroy(
      media.cloudinaryId,
      media.type === MediaType.VIDEO ? 'video' : 'image',
    );
    await this.mediaRepository.delete(mediaId);
  }

  async getGallery(vehicleId: string, category?: MediaCategory) {
    const items = await this.mediaRepository.findByVehicleGallery(vehicleId, category);
    return items.map(mapMedia);
  }

  async getPrimaryPhotoUrlsByVehicleIds(vehicleIds: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>(vehicleIds.map((id) => [id, null]));

    if (vehicleIds.length === 0) {
      return result;
    }

    const mediaItems = await this.mediaRepository.findPrimaryPhotosByVehicleIds(vehicleIds);

    for (const media of mediaItems) {
      const usage = media.usages.find((u) => u.entityType === MediaEntity.VEHICLE && u.isPrimary);
      if (!usage) continue;

      const mediumVariant = media.variants.find((v) => v.type === 'MEDIUM');
      const url = mediumVariant?.cloudinaryUrl ?? media.cloudinaryUrl;

      result.set(usage.entityId, url);
    }

    return result;
  }

  async setPrimary(userId: string, mediaId: string) {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new NotFoundException(ErrorCodes.Media.NOT_FOUND);
    }

    const usage = media.usages[0];
    if (!usage) {
      throw new NotFoundException(ErrorCodes.Media.NOT_FOUND);
    }

    if (usage.entityType !== MediaEntity.VEHICLE) {
      throw new BadRequestException(ErrorCodes.Media.INVALID_ENTITY_TYPE);
    }

    const context = await this.mediaRepository.resolveEntityContext(
      usage.entityType,
      usage.entityId,
    );
    if (!context?.workspaceId) {
      throw new NotFoundException(ErrorCodes.Media.ENTITY_NOT_FOUND);
    }

    await this.assertAccess(userId, usage.entityType, context.workspaceId);

    await this.mediaRepository.clearPrimaryForEntity(usage.entityType, usage.entityId);
    await this.mediaRepository.setUsagePrimary(media.id, true);
    await this.prisma.vehicle.update({
      where: { id: usage.entityId },
      data: { primaryPhotoId: media.id },
    });

    const updated = await this.mediaRepository.findById(mediaId);
    return mapMedia(updated!);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async assertAccess(
    userId: string,
    entityType: MediaEntity,
    workspaceId: string | null,
  ): Promise<void> {
    if (entityType === MediaEntity.USER) {
      return;
    }

    if (!workspaceId) {
      throw new NotFoundException(ErrorCodes.Media.ENTITY_NOT_FOUND);
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) {
      throw new ForbiddenException(ErrorCodes.Media.ACCESS_DENIED);
    }
  }

  private async hasWorkspaceRole(
    userId: string,
    workspaceId: string,
    roles: Role[],
  ): Promise<boolean> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    return !!member && roles.includes(member.role);
  }

  private async syncPrimary(
    entityType: MediaEntity,
    entityId: string,
    mediaId: string,
    cloudinaryUrl: string,
  ): Promise<void> {
    if (entityType === MediaEntity.USER) {
      await this.prisma.user.update({
        where: { id: entityId },
        data: { avatarUrl: cloudinaryUrl },
      });
      return;
    }

    if (entityType === MediaEntity.VEHICLE) {
      await this.prisma.vehicle.update({
        where: { id: entityId },
        data: { primaryPhotoId: mediaId },
      });
    }
  }

  private buildVariantsInput(result: CloudinaryUploadResult): CreateMediaInput['variants'] {
    const variants: CreateMediaInput['variants'] = [
      {
        type: 'ORIGINAL',
        cloudinaryUrl: result.url,
        storageKey: result.publicId,
        width: result.width,
        height: result.height,
        sizeBytes: result.bytes,
      },
    ];

    const entries: Array<
      [CreateMediaInput['variants'][number]['type'], typeof result.variants.thumbnail]
    > = [
      ['THUMBNAIL', result.variants.thumbnail],
      ['SMALL', result.variants.small],
      ['MEDIUM', result.variants.medium],
      ['LARGE', result.variants.large],
    ];

    for (const [type, variant] of entries) {
      if (variant) {
        variants.push({
          type,
          cloudinaryUrl: variant.url,
          storageKey: result.publicId,
          width: variant.width,
          height: variant.height,
          sizeBytes: variant.bytes,
        });
      }
    }

    return variants;
  }
}
