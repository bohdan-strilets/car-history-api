import { Injectable } from '@nestjs/common';
import { DocumentType, Prisma, TimelineType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCostsGroupedByType = async (vehicleId: string, from: Date | null, to: Date | null) =>
    this.prisma.timelineEvent.groupBy({
      by: ['type'],
      where: {
        vehicleId,
        deletedAt: null,
        cost: { not: null },
        ...(from && to ? { eventDate: { gte: from, lte: to } } : {}),
      },
      _sum: { cost: true },
      _count: { _all: true },
    });

  findCostsGroupedByMonth = async (vehicleId: string, from: Date | null, to: Date | null) =>
    this.prisma.$queryRaw<{ month: Date; totalCost: Prisma.Decimal | null }[]>`
      SELECT date_trunc('month', "eventDate") AS month, SUM(cost) AS "totalCost"
      FROM timeline_events
      WHERE "vehicleId" = ${vehicleId}
        AND "deletedAt" IS NULL
        AND cost IS NOT NULL
        ${from && to ? Prisma.sql`AND "eventDate" BETWEEN ${from} AND ${to}` : Prisma.empty}
      GROUP BY month
      ORDER BY month ASC
    `;

  findMileageAtOrBeforeDate = async (vehicleId: string, date: Date) =>
    this.prisma.timelineEvent.findFirst({
      where: { vehicleId, deletedAt: null, eventDate: { lte: date } },
      orderBy: { eventDate: 'desc' },
      select: { mileage: true, eventDate: true },
    });

  findVehicleMileageAndPurchaseInfo = async (vehicleId: string) =>
    this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { currentMileage: true, purchaseInfo: true },
    });

  findFullTankRefuelsUpTo = async (vehicleId: string, to: Date | null) =>
    this.prisma.timelineEvent.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        type: TimelineType.REFUEL,
        refuel: { isFullTank: true },
        ...(to ? { eventDate: { lte: to } } : {}),
      },
      orderBy: { eventDate: 'asc' },
      select: {
        id: true,
        eventDate: true,
        mileage: true,
        refuel: { select: { liters: true } },
      },
    });

  findFuelCostsByType = async (vehicleId: string, from: Date | null, to: Date | null) =>
    this.prisma.timelineEvent.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        type: TimelineType.REFUEL,
        ...(from && to ? { eventDate: { gte: from, lte: to } } : {}),
      },
      select: {
        cost: true,
        refuel: { select: { fuelType: true, liters: true, pricePerLiter: true } },
      },
    });

  findCostsGroupedByServiceStation = async (
    vehicleId: string,
    from: Date | null,
    to: Date | null,
  ) =>
    this.prisma.timelineEvent.groupBy({
      by: ['serviceStationId'],
      where: {
        vehicleId,
        deletedAt: null,
        cost: { not: null },
        serviceStationId: { not: null },
        ...(from && to ? { eventDate: { gte: from, lte: to } } : {}),
      },
      _sum: { cost: true },
      _count: { _all: true },
    });

  findServiceStationsByIds = async (ids: string[]) =>
    this.prisma.serviceStation.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, visitCount: true },
    });

  findInsuranceCosts = async (vehicleId: string, yearFrom: Date, yearTo: Date) =>
    this.prisma.timelineEvent.findMany({
      where: {
        vehicleId,
        deletedAt: null,
        type: TimelineType.DOCUMENT,
        document: { type: { in: [DocumentType.INSURANCE_OC, DocumentType.INSURANCE_AC] } },
        eventDate: { gte: yearFrom, lte: yearTo },
      },
      select: { cost: true, document: { select: { type: true } } },
    });

  findTotalCostSince = async (vehicleId: string, fromDate: Date | null) => {
    const result = await this.prisma.timelineEvent.aggregate({
      where: {
        vehicleId,
        deletedAt: null,
        cost: { not: null },
        ...(fromDate ? { eventDate: { gte: fromDate } } : {}),
      },
      _sum: { cost: true },
    });

    return result._sum.cost;
  };
}
