import { BadRequestException, ConflictException, ErrorCodes } from '@common/exceptions';
import { assertCanDeleteOwnedResource } from '@common/utils';
import { MilestonesService } from '@modules/milestones';
import { RemindersService } from '@modules/reminders';
import { ServiceStationsService } from '@modules/service-stations';
import { TiresService } from '@modules/tires';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, Role, TimelineType, TireChangeType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

import { CreateTimelineEventDto, TimelineQueryDto, UpdateTimelineEventDto } from './dto';
import { TimelineRepository } from './timeline.repository';
import { CreateTimelineEventInput } from './types';

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(
    private readonly timelineRepository: TimelineRepository,
    private readonly milestonesService: MilestonesService,
    private readonly remindersService: RemindersService,
    private readonly tiresService: TiresService,
    private readonly serviceStationsService: ServiceStationsService,
  ) {}

  // ─── Queries ───────────────────────────────────────────────────────────────

  async getTimeline(vehicleId: string, query: TimelineQueryDto) {
    return this.timelineRepository.findMany(vehicleId, query);
  }

  async getEvent(vehicleId: string, eventId: string) {
    const event = await this.timelineRepository.findById(eventId);
    if (!event) throw new NotFoundException(ErrorCodes.Timeline.EVENT_NOT_FOUND);
    this.assertBelongsToVehicle(event, vehicleId);
    return event;
  }

  // ─── Commands ──────────────────────────────────────────────────────────────

  async createEvent(vehicleId: string, dto: CreateTimelineEventDto, userId: string) {
    if (dto.type === TimelineType.PURCHASE || dto.type === TimelineType.SALE) {
      await this.assertUniqueEventType(vehicleId, dto.type);
    }

    if (dto.type === TimelineType.CHARGE) {
      const fuelTypes = await this.timelineRepository.getVehicleFuelTypes(vehicleId);
      const isChargeable = fuelTypes.includes('ELECTRIC') || fuelTypes.includes('HYBRID');
      if (!isChargeable) {
        throw new BadRequestException(ErrorCodes.Timeline.CHARGE_NOT_SUPPORTED);
      }
    }

    const data = this.buildCreateData(vehicleId, dto, userId);
    const event = await this.timelineRepository.create(data);

    await this.timelineRepository.createMileageLog(vehicleId, event.id, dto.mileage, dto.type);

    if (dto.type === TimelineType.PURCHASE || dto.type === TimelineType.SALE) {
      await this.timelineRepository.syncVehicleInfoFromEvent(vehicleId, dto.type, {
        date: new Date(dto.eventDate),
        price: dto.cost ? Number(dto.cost) : undefined,
        mileage: dto.mileage,
      });
    }

    if (dto.type === TimelineType.DOCUMENT) {
      const raw = await this.timelineRepository.findRawById(event.id);
      if (raw?.document) {
        await this.remindersService.syncFromDocument({
          vehicleId,
          documentId: raw.document.id,
          documentType: raw.document.type,
          expireDate: raw.document.expireDate,
          title: event.title,
        });
      }
    }

    if (dto.type !== TimelineType.SALE) {
      try {
        await this.milestonesService.checkAndAward({
          userId,
          vehicleId,
          eventType: dto.type,
          mileage: dto.mileage,
          cost: dto.cost ? Number(dto.cost) : undefined,
        });
      } catch (error) {
        this.logger.error('Failed to check and award milestone', {
          error: error instanceof Error ? error.message : String(error),
          userId,
          vehicleId,
          eventType: dto.type,
        });
      }
    }

    if (dto.type === TimelineType.TIRE_CHANGE) {
      if (dto.changeType === TireChangeType.REMOVE) {
        await this.tiresService.unmount(dto.tireId!);
      } else if (dto.changeType === TireChangeType.INSTALL) {
        await this.tiresService.mount(dto.tireId!, vehicleId);
      }
    }

    if (dto.serviceStationId) {
      await this.serviceStationsService.recalculateVisitStats(dto.serviceStationId);
    }

    return event;
  }

  async updateEvent(vehicleId: string, eventId: string, dto: UpdateTimelineEventDto) {
    const event = await this.timelineRepository.findById(eventId);
    if (!event) throw new NotFoundException(ErrorCodes.Timeline.EVENT_NOT_FOUND);
    this.assertBelongsToVehicle(event, vehicleId);

    const updated = await this.timelineRepository.update(eventId, {
      title: dto.title,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      mileage: dto.mileage,
      cost: dto.cost != null ? new Decimal(dto.cost) : undefined,
      description: dto.description,
      serviceStationId: dto.serviceStationId,
    });

    if (dto.mileage !== undefined && dto.mileage !== event.mileage) {
      await this.timelineRepository.updateMileageLog(event.vehicleId, eventId, dto.mileage);
    }

    if (event.type === TimelineType.DOCUMENT) {
      const raw = await this.timelineRepository.findRawById(eventId);
      if (raw?.document) {
        await this.remindersService.syncFromDocument({
          vehicleId: event.vehicleId,
          documentId: raw.document.id,
          documentType: raw.document.type,
          expireDate: raw.document.expireDate,
          title: updated.title,
        });
      }
    }

    const stationsToRecalculate = new Set<string>();
    if (event.serviceStation?.id) stationsToRecalculate.add(event.serviceStation.id);
    if (dto.serviceStationId) stationsToRecalculate.add(dto.serviceStationId);

    for (const stationId of stationsToRecalculate) {
      await this.serviceStationsService.recalculateVisitStats(stationId);
    }

    return updated;
  }

  async deleteEvent(vehicleId: string, eventId: string, memberRole: Role, userId: string) {
    const event = await this.timelineRepository.findById(eventId);
    if (!event) throw new NotFoundException(ErrorCodes.Timeline.EVENT_NOT_FOUND);
    this.assertBelongsToVehicle(event, vehicleId);

    assertCanDeleteOwnedResource({
      memberRole,
      resourceCreatedBy: event.createdBy,
      userId,
    });

    if (event.type === TimelineType.DOCUMENT) {
      const raw = await this.timelineRepository.findRawById(eventId);
      if (raw?.document) {
        await this.remindersService.deleteByDocumentId(raw.document.id);
      }
    }

    await Promise.all([
      this.timelineRepository.softDelete(eventId),
      this.timelineRepository.deleteMileageLog(event.vehicleId, eventId),
    ]);

    if (event.type === TimelineType.PURCHASE || event.type === TimelineType.SALE) {
      await this.timelineRepository.syncVehicleInfoFromEvent(event.vehicleId, event.type, null);
    }

    if (event.serviceStation?.id) {
      await this.serviceStationsService.recalculateVisitStats(event.serviceStation.id);
    }
  }

  // ─── Builder ───────────────────────────────────────────────────────────────

  private buildCreateData(
    vehicleId: string,
    dto: CreateTimelineEventDto,
    userId: string,
  ): CreateTimelineEventInput {
    const base: CreateTimelineEventInput = {
      vehicleId,
      createdBy: userId,
      type: dto.type,
      title: dto.title,
      eventDate: new Date(dto.eventDate),
      mileage: dto.mileage,
      cost: dto.cost != null ? new Decimal(dto.cost) : null,
      description: dto.description ?? null,
      serviceStationId: dto.serviceStationId ?? null,
    };

    switch (dto.type) {
      case TimelineType.REFUEL:
        return {
          ...base,
          refuel: {
            liters: new Decimal(dto.liters!),
            pricePerLiter: new Decimal(dto.pricePerLiter!),
            fuelType: dto.fuelType!,
            isFullTank: dto.isFullTank!,
          },
        };

      case TimelineType.CHARGE:
        return {
          ...base,
          charge: {
            kWh: new Decimal(dto.kWh!),
            pricePerKWh: new Decimal(dto.pricePerKWh!),
            chargeType: dto.chargeType!,
            chargerNetwork: dto.chargerNetwork ?? null,
            batteryBefore: dto.batteryBefore ?? null,
            batteryAfter: dto.batteryAfter ?? null,
          },
        };

      case TimelineType.SERVICE:
        return {
          ...base,
          service: {
            category: dto.serviceCategory!,
            works: JSON.parse(JSON.stringify(dto.works ?? [])),
            parts: JSON.parse(JSON.stringify(dto.parts ?? [])),
          },
        };

      case TimelineType.DOCUMENT:
        return {
          ...base,
          document: {
            type: dto.documentType!,
            documentNumber: dto.documentNumber ?? null,
            issuedBy: dto.issuedBy ?? null,
            issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
            expireDate: dto.expireDate ? new Date(dto.expireDate) : null,
          },
        };

      case TimelineType.EXPENSE:
        return {
          ...base,
          expense: {
            category: dto.expenseCategory!,
          },
        };

      case TimelineType.TIRE_CHANGE:
        return {
          ...base,
          tireChange: {
            tire: { connect: { id: dto.tireId } },
            changeType: dto.changeType!,
            installedMileage: dto.installedMileage ?? null,
            removedMileage: dto.removedMileage ?? null,
            removedDate: dto.removedDate ? new Date(dto.removedDate) : null,
          },
        };

      case TimelineType.TRIP:
        return {
          ...base,
          trip: {
            startMileage: dto.startMileage!,
            endMileage: dto.endMileage!,
            startLocation: dto.startLocation ?? null,
            endLocation: dto.endLocation ?? null,
            distanceKm: new Decimal(dto.distanceKm!),
            purpose: dto.purpose!,
          },
        };

      case TimelineType.PURCHASE:
        return {
          ...base,
          purchase: {
            purchasedFrom: dto.purchasedFrom!,
            country: dto.country ?? null,
          },
        };

      case TimelineType.SALE:
        return {
          ...base,
          sale: {
            soldTo: dto.soldTo!,
          },
        };

      default:
        return base;
    }
  }

  async createMaintenanceServiceEvent(
    params: {
      vehicleId: string;
      maintenanceIntervalId: string;
      title: string;
      mileage: number;
      eventDate: Date;
    },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const event = await this.timelineRepository.create(
      {
        vehicleId: params.vehicleId,
        type: TimelineType.SERVICE,
        title: params.title,
        eventDate: params.eventDate,
        mileage: params.mileage,
        cost: null,
        description: null,
        serviceStationId: null,
        service: {
          category: 'MAINTENANCE',
          works: [],
          parts: [],
          maintenanceIntervalId: params.maintenanceIntervalId,
        },
      },
      tx,
    );

    await this.timelineRepository.createMileageLog(
      params.vehicleId,
      event.id,
      params.mileage,
      TimelineType.SERVICE,
      tx,
    );
  }

  // Private Methods
  private async assertUniqueEventType(vehicleId: string, type: TimelineType): Promise<void> {
    const count = await this.timelineRepository.countByType(vehicleId, type);
    if (count > 0) {
      throw new ConflictException(ErrorCodes.Timeline.EVENT_ALREADY_EXISTS);
    }
  }

  private assertBelongsToVehicle(event: { vehicleId: string }, vehicleId: string): void {
    if (event.vehicleId !== vehicleId) {
      throw new NotFoundException(ErrorCodes.Timeline.EVENT_NOT_FOUND);
    }
  }
}
