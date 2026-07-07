import { ErrorCodes, ForbiddenException, NotFoundException } from '@common/exceptions';
import { Injectable } from '@nestjs/common';
import { Prisma, ServiceStation } from '@prisma/client';

import { CreateServiceStationDto, ServiceStationResponseDto, UpdateServiceStationDto } from './dto';
import { toServiceStationResponse } from './mappers';
import { ServiceStationsRepository } from './service-stations.repository';

@Injectable()
export class ServiceStationsService {
  constructor(private readonly serviceStationsRepo: ServiceStationsRepository) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async getAllByUserId(userId: string): Promise<ServiceStationResponseDto[]> {
    const stations = await this.serviceStationsRepo.findAllByUserId(userId);
    return stations.map(toServiceStationResponse);
  }

  async getById(userId: string, id: string): Promise<ServiceStationResponseDto> {
    const station = await this.assertOwnership(userId, id);
    return toServiceStationResponse(station);
  }

  // ─── Commands ─────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateServiceStationDto): Promise<ServiceStationResponseDto> {
    const station = await this.serviceStationsRepo.create({
      userId,
      name: dto.name,
      type: dto.type,
      address: dto.address,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      phone: dto.phone ?? null,
      website: dto.website ?? null,
      notes: dto.notes ?? null,
      googlePlaceId: dto.googlePlaceId ?? null,
      googleRating: dto.googleRating ?? null,
    });

    return toServiceStationResponse(station);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateServiceStationDto,
  ): Promise<ServiceStationResponseDto> {
    await this.assertOwnership(userId, id);

    const updated = await this.serviceStationsRepo.update(id, {
      name: dto.name,
      type: dto.type,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      phone: dto.phone,
      website: dto.website,
      notes: dto.notes,
      myRating: dto.myRating,
    });

    return toServiceStationResponse(updated);
  }

  async toggleFavorite(userId: string, id: string): Promise<ServiceStationResponseDto> {
    const station = await this.assertOwnership(userId, id);
    const updated = await this.serviceStationsRepo.toggleFavorite(id, !station.isFavorite);
    return toServiceStationResponse(updated);
  }

  async delete(userId: string, id: string): Promise<void> {
    await this.assertOwnership(userId, id);
    await this.serviceStationsRepo.delete(id);
  }

  async recalculateVisitStats(
    serviceStationId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.serviceStationsRepo.recalculateVisitStats(serviceStationId, tx);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private async assertOwnership(userId: string, id: string): Promise<ServiceStation> {
    const station = await this.serviceStationsRepo.findById(id);
    if (!station) throw new NotFoundException(ErrorCodes.ServiceStation.NOT_FOUND);
    if (station.userId !== userId) {
      throw new ForbiddenException(ErrorCodes.ServiceStation.ACCESS_DENIED);
    }
    return station;
  }
}
