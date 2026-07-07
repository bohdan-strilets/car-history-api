import { ConflictException, ErrorCodes } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { Prisma, ServiceStation } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateServiceStationInput, UpdateServiceStationInput } from './types';

@Injectable()
export class ServiceStationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: string): Promise<ServiceStation[]> {
    return this.prisma.serviceStation.findMany({
      where: { userId },
      orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string): Promise<ServiceStation | null> {
    return this.prisma.serviceStation.findUnique({ where: { id } });
  }

  async create(data: CreateServiceStationInput): Promise<ServiceStation> {
    try {
      return await this.prisma.serviceStation.create({
        data: {
          userId: data.userId,
          name: data.name,
          type: data.type,
          address: data.address as Prisma.InputJsonValue,
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone,
          website: data.website,
          notes: data.notes,
          googlePlaceId: data.googlePlaceId,
          googleRating: data.googleRating,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(ErrorCodes.ServiceStation.ALREADY_EXISTS);
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateServiceStationInput): Promise<ServiceStation> {
    return this.prisma.serviceStation.update({
      where: { id },
      data: {
        ...data,
        address: data.address ? (data.address as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.serviceStation.delete({ where: { id } });
  }

  async recalculateVisitStats(
    serviceStationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    const events = await client.timelineEvent.findMany({
      where: { serviceStationId, deletedAt: null },
      select: { eventDate: true },
      orderBy: { eventDate: 'desc' },
    });

    await client.serviceStation.update({
      where: { id: serviceStationId },
      data: {
        visitCount: events.length,
        lastVisitedAt: events[0]?.eventDate ?? null,
      },
    });
  }

  async toggleFavorite(id: string, isFavorite: boolean): Promise<ServiceStation> {
    return this.prisma.serviceStation.update({
      where: { id },
      data: { isFavorite },
    });
  }
}
