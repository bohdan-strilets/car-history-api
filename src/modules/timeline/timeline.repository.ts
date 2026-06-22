import { PaginatedData } from '@common/types';
import { Injectable } from '@nestjs/common';
import { MileageSource, Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { TimelineQueryDto } from './dto';
import { mapTimelineEvent } from './mappers';
import { timelineEventInclude } from './selects';
import {
  CreateTimelineEventInput,
  MappedTimelineEvent,
  TimelineEventWithRelations,
  UpdateTimelineEventInput,
} from './types';

@Injectable()
export class TimelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    vehicleId: string,
    query: TimelineQueryDto,
  ): Promise<PaginatedData<MappedTimelineEvent>> {
    const { page = 1, limit = 20, type, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TimelineEventWhereInput = {
      vehicleId,
      deletedAt: null,
      ...(type?.length && { type: { in: type } }),
      ...(dateFrom || dateTo
        ? {
            eventDate: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    };

    const [events, total] = await this.prisma.$transaction([
      this.prisma.timelineEvent.findMany({
        where,
        include: timelineEventInclude,
        orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.timelineEvent.count({ where }),
    ]);

    return {
      data: events.map(mapTimelineEvent),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(eventId: string): Promise<MappedTimelineEvent | null> {
    const event = await this.prisma.timelineEvent.findUnique({
      where: { id: eventId, deletedAt: null },
      include: timelineEventInclude,
    });

    return event ? mapTimelineEvent(event) : null;
  }

  async create(data: CreateTimelineEventInput): Promise<MappedTimelineEvent> {
    const {
      refuel,
      charge,
      service,
      document,
      expense,
      tireChange,
      trip,
      purchase,
      sale,
      ...eventData
    } = data;

    const event = await this.prisma.timelineEvent.create({
      data: {
        ...eventData,
        ...(refuel && { refuel: { create: refuel } }),
        ...(charge && { charge: { create: charge } }),
        ...(service && { service: { create: service } }),
        ...(document && { document: { create: document } }),
        ...(expense && { expense: { create: expense } }),
        ...(tireChange && { tireChange: { create: tireChange } }),
        ...(trip && { trip: { create: trip } }),
        ...(purchase && { purchase: { create: purchase } }),
        ...(sale && { sale: { create: sale } }),
      },
      include: timelineEventInclude,
    });

    return mapTimelineEvent(event);
  }

  async update(eventId: string, data: UpdateTimelineEventInput): Promise<MappedTimelineEvent> {
    const event = await this.prisma.timelineEvent.update({
      where: { id: eventId },
      data,
      include: timelineEventInclude,
    });

    return mapTimelineEvent(event);
  }

  async softDelete(eventId: string): Promise<void> {
    await this.prisma.timelineEvent.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });
  }

  async updateMileageLog(vehicleId: string, eventId: string, mileage: number): Promise<void> {
    await this.prisma.mileageLog.updateMany({
      where: { eventId },
      data: { mileage },
    });

    const maxLog = await this.prisma.mileageLog.findFirst({
      where: { vehicleId },
      orderBy: { mileage: 'desc' },
    });

    if (maxLog) {
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { currentMileage: maxLog.mileage },
      });
    }
  }

  async createMileageLog(
    vehicleId: string,
    eventId: string,
    mileage: number,
    source: MileageSource,
  ): Promise<void> {
    await this.prisma.mileageLog.create({
      data: { vehicleId, eventId, mileage, source },
    });

    const maxLog = await this.prisma.mileageLog.findFirst({
      where: { vehicleId },
      orderBy: { mileage: 'desc' },
    });

    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentMileage: maxLog?.mileage ?? mileage },
    });
  }

  async deleteMileageLog(vehicleId: string, eventId: string): Promise<void> {
    await this.prisma.mileageLog.deleteMany({
      where: { eventId },
    });

    const maxLog = await this.prisma.mileageLog.findFirst({
      where: { vehicleId },
      orderBy: { mileage: 'desc' },
    });

    await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentMileage: maxLog?.mileage ?? 0 },
    });
  }

  async getVehicleCurrentMileage(vehicleId: string): Promise<number> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { currentMileage: true },
    });

    return vehicle?.currentMileage ?? 0;
  }

  async findRawById(eventId: string): Promise<TimelineEventWithRelations | null> {
    return this.prisma.timelineEvent.findUnique({
      where: { id: eventId, deletedAt: null },
      include: timelineEventInclude,
    });
  }
}
