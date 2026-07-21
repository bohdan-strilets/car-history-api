import { PAGINATION_DEFAULTS } from '@common/constants';
import { PaginatedData } from '@common/types';
import { Injectable } from '@nestjs/common';
import { MileageSource, Prisma, TimelineType } from '@prisma/client';
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
    const {
      page = PAGINATION_DEFAULTS.DEFAULT_PAGE,
      limit = PAGINATION_DEFAULTS.DEFAULT_LIMIT,
      type,
      dateFrom,
      dateTo,
    } = query;
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

  async create(
    data: CreateTimelineEventInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MappedTimelineEvent> {
    const client = tx ?? this.prisma;
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

    const event = await client.timelineEvent.create({
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
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    await client.mileageLog.create({
      data: { vehicleId, eventId, mileage, source },
    });

    const maxLog = await client.mileageLog.findFirst({
      where: { vehicleId },
      orderBy: { mileage: 'desc' },
    });

    await client.vehicle.update({
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

  async softDeleteAllByVehicleId(vehicleId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.timelineEvent.updateMany({
      where: { vehicleId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async deleteAllMileageLogsByVehicleId(
    vehicleId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.mileageLog.deleteMany({ where: { vehicleId } });
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

  async countByType(vehicleId: string, type: TimelineType): Promise<number> {
    return this.prisma.timelineEvent.count({
      where: { vehicleId, type, deletedAt: null },
    });
  }

  async syncVehicleInfoFromEvent(
    vehicleId: string,
    type: TimelineType,
    data: { date?: Date; price?: number; mileage?: number } | null,
  ): Promise<void> {
    if (type === TimelineType.PURCHASE) {
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { purchaseInfo: data ?? Prisma.JsonNull },
      });
    }

    if (type === TimelineType.SALE) {
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          saleInfo: data ?? Prisma.JsonNull,
          status: data ? 'ARCHIVE' : 'ACTIVE',
        },
      });
    }
  }

  async getVehicleFuelTypes(vehicleId: string): Promise<string[]> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { fuelType: true },
    });
    return vehicle?.fuelType ?? [];
  }

  async getMonthlyExpensesByVehicleIds(vehicleIds: string[]): Promise<Map<string, number>> {
    const result = new Map<string, number>(vehicleIds.map((id) => [id, 0]));

    if (vehicleIds.length === 0) {
      return result;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const grouped = await this.prisma.timelineEvent.groupBy({
      by: ['vehicleId'],
      where: {
        vehicleId: { in: vehicleIds },
        deletedAt: null,
        eventDate: { gte: startOfMonth },
      },
      _sum: { cost: true },
    });

    for (const row of grouped) {
      result.set(row.vehicleId, row._sum.cost ? Number(row._sum.cost) : 0);
    }

    return result;
  }

  async getLatestInsuranceExpireDatesByVehicleIds(
    vehicleIds: string[],
  ): Promise<Map<string, Date | null>> {
    const result = new Map<string, Date | null>(vehicleIds.map((id) => [id, null]));

    if (vehicleIds.length === 0) return result;

    const documents = await this.prisma.document.findMany({
      where: {
        type: 'INSURANCE_OC',
        event: { vehicleId: { in: vehicleIds }, deletedAt: null },
      },
      select: {
        expireDate: true,
        event: { select: { vehicleId: true } },
      },
      orderBy: { expireDate: 'desc' },
    });

    const seen = new Set<string>();

    for (const doc of documents) {
      const vehicleId = doc.event.vehicleId;
      if (seen.has(vehicleId)) continue;
      seen.add(vehicleId);
      result.set(vehicleId, doc.expireDate);
    }

    return result;
  }

  async getRecentFullTankRefuelsByVehicleIds(
    vehicleIds: string[],
  ): Promise<Map<string, Array<{ mileage: number; liters: number }>>> {
    const result = new Map<string, Array<{ mileage: number; liters: number }>>(
      vehicleIds.map((id) => [id, []]),
    );

    if (vehicleIds.length === 0) {
      return result;
    }

    const refuels = await this.prisma.refuel.findMany({
      where: {
        isFullTank: true,
        event: { vehicleId: { in: vehicleIds }, deletedAt: null },
      },
      select: {
        liters: true,
        event: { select: { vehicleId: true, mileage: true, eventDate: true } },
      },
      orderBy: { event: { eventDate: 'desc' } },
    });

    for (const refuel of refuels) {
      const vehicleId = refuel.event.vehicleId;
      const list = result.get(vehicleId);
      if (!list) continue;

      // Only keep the 3 most recent full-tank refuels per vehicle — enough to
      // compute one consumption delta, capped to avoid unbounded growth.
      if (list.length >= 3) continue;

      list.push({ mileage: refuel.event.mileage, liters: refuel.liters.toNumber() });
    }

    return result;
  }
}
