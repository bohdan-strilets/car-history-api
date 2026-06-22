import { ErrorCodes } from '@common/exceptions';
import { MilestonesService } from '@modules/milestones';
import { RemindersService } from '@modules/reminders';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TimelineType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';

import { CreateTimelineEventDto, TimelineQueryDto, UpdateTimelineEventDto } from './dto';
import { TimelineRepository } from './timeline.repository';
import { CreateTimelineEventInput } from './types';

@Injectable()
export class TimelineService {
  constructor(
    private readonly timelineRepository: TimelineRepository,
    private readonly milestonesService: MilestonesService,
    private readonly remindersService: RemindersService,
  ) {}

  // ─── Queries ───────────────────────────────────────────────────────────────

  async getTimeline(vehicleId: string, query: TimelineQueryDto) {
    return this.timelineRepository.findMany(vehicleId, query);
  }

  async getEvent(eventId: string) {
    const event = await this.timelineRepository.findById(eventId);
    if (!event) throw new NotFoundException(ErrorCodes.Timeline.EVENT_NOT_FOUND);
    return event;
  }

  // ─── Commands ──────────────────────────────────────────────────────────────

  async createEvent(vehicleId: string, dto: CreateTimelineEventDto, userId: string) {
    const data = this.buildCreateData(vehicleId, dto);
    const event = await this.timelineRepository.create(data);

    await this.timelineRepository.createMileageLog(vehicleId, event.id, dto.mileage, dto.type);

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

    await this.milestonesService
      .checkAndAward({
        userId,
        vehicleId,
        eventType: dto.type,
        mileage: dto.mileage,
        cost: dto.cost ? Number(dto.cost) : undefined,
      })
      .catch((err) => console.error('❌ checkAndAward error:', err));

    return event;
  }

  async updateEvent(eventId: string, dto: UpdateTimelineEventDto, userId: string) {
    const event = await this.timelineRepository.findById(eventId);
    if (!event) throw new NotFoundException(ErrorCodes.Timeline.EVENT_NOT_FOUND);

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

    await this.milestonesService
      .checkAndAward({
        userId,
        vehicleId: event.vehicleId,
        eventType: event.type,
        mileage: dto.mileage ?? event.mileage,
        cost: dto.cost != null ? Number(dto.cost) : undefined,
      })
      .catch((err) => console.error('❌ checkAndAward error:', err));

    return updated;
  }

  async deleteEvent(eventId: string) {
    const event = await this.timelineRepository.findById(eventId);
    if (!event) throw new NotFoundException(ErrorCodes.Timeline.EVENT_NOT_FOUND);

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
  }

  // ─── Builder ───────────────────────────────────────────────────────────────

  private buildCreateData(
    vehicleId: string,
    dto: CreateTimelineEventDto,
  ): CreateTimelineEventInput {
    const base: CreateTimelineEventInput = {
      vehicleId,
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
}
