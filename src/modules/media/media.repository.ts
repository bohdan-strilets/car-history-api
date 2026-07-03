import { Injectable } from '@nestjs/common';
import { MediaCategory, MediaEntity } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { mediaInclude } from './selects';
import { CreateMediaInput, EntityContext, MappedMedia } from './types';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Entity resolution ────────────────────────────────────────────────────

  async resolveEntityContext(
    entityType: MediaEntity,
    entityId: string,
  ): Promise<EntityContext | null> {
    switch (entityType) {
      case MediaEntity.USER:
        return { workspaceId: null, vehicleId: null };

      case MediaEntity.VEHICLE: {
        const vehicle = await this.prisma.vehicle.findUnique({
          where: { id: entityId, deletedAt: null },
          select: { id: true, workspaceId: true },
        });
        if (!vehicle) return null;
        return { workspaceId: vehicle.workspaceId, vehicleId: vehicle.id };
      }

      case MediaEntity.TIRE: {
        const tire = await this.prisma.tire.findUnique({
          where: { id: entityId },
          select: { vehicleId: true, vehicle: { select: { workspaceId: true } } },
        });
        if (!tire) return null;
        return { workspaceId: tire.vehicle.workspaceId, vehicleId: tire.vehicleId };
      }

      case MediaEntity.SERVICE: {
        const service = await this.prisma.service.findUnique({
          where: { id: entityId },
          select: {
            event: { select: { vehicleId: true, vehicle: { select: { workspaceId: true } } } },
          },
        });
        if (!service) return null;
        return {
          workspaceId: service.event.vehicle.workspaceId,
          vehicleId: service.event.vehicleId,
        };
      }

      case MediaEntity.DOCUMENT: {
        const document = await this.prisma.document.findUnique({
          where: { id: entityId },
          select: {
            event: { select: { vehicleId: true, vehicle: { select: { workspaceId: true } } } },
          },
        });
        if (!document) return null;
        return {
          workspaceId: document.event.vehicle.workspaceId,
          vehicleId: document.event.vehicleId,
        };
      }

      case MediaEntity.EXPENSE: {
        const expense = await this.prisma.expense.findUnique({
          where: { id: entityId },
          select: {
            event: { select: { vehicleId: true, vehicle: { select: { workspaceId: true } } } },
          },
        });
        if (!expense) return null;
        return {
          workspaceId: expense.event.vehicle.workspaceId,
          vehicleId: expense.event.vehicleId,
        };
      }

      case MediaEntity.TRIP: {
        const trip = await this.prisma.trip.findUnique({
          where: { id: entityId },
          select: {
            event: { select: { vehicleId: true, vehicle: { select: { workspaceId: true } } } },
          },
        });
        if (!trip) return null;
        return { workspaceId: trip.event.vehicle.workspaceId, vehicleId: trip.event.vehicleId };
      }

      default:
        return null;
    }
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async findById(mediaId: string): Promise<MappedMedia | null> {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: mediaInclude,
    });

    return media;
  }

  async findByVehicleGallery(vehicleId: string, category?: MediaCategory): Promise<MappedMedia[]> {
    return this.prisma.media.findMany({
      where: {
        usages: {
          some: {
            entityType: MediaEntity.VEHICLE,
            entityId: vehicleId,
            ...(category && { category }),
          },
        },
      },
      include: mediaInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(input: CreateMediaInput): Promise<MappedMedia> {
    return this.prisma.media.create({
      data: {
        uploadedBy: input.uploadedBy,
        cloudinaryId: input.cloudinaryId,
        cloudinaryUrl: input.cloudinaryUrl,
        type: input.type,
        mimeType: input.mimeType,
        originalName: input.originalName,
        storageKey: input.storageKey,
        sizeBytes: input.sizeBytes,
        width: input.width,
        height: input.height,
        durationSeconds: input.durationSeconds,
        variants: {
          create: input.variants.map((v) => ({
            type: v.type,
            cloudinaryUrl: v.cloudinaryUrl,
            storageKey: v.storageKey,
            width: v.width,
            height: v.height,
            sizeBytes: v.sizeBytes,
          })),
        },
        usages: {
          create: {
            entityType: input.usage.entityType,
            entityId: input.usage.entityId,
            category: input.usage.category,
            isPrimary: input.usage.isPrimary,
          },
        },
      },
      include: mediaInclude,
    });
  }

  async delete(mediaId: string): Promise<void> {
    await this.prisma.media.delete({ where: { id: mediaId } });
  }
}
