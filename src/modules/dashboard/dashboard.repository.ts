import { DASHBOARD_EXPENSE_EXCLUDED_TYPES } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { TimelineType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { NearestDocumentRow } from './types';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findNearestDocumentsByVehicleIds = async (
    vehicleIds: string[],
  ): Promise<NearestDocumentRow[]> => {
    if (vehicleIds.length === 0) return [];

    const rows = await this.prisma.timelineEvent.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        deletedAt: null,
        type: TimelineType.DOCUMENT,
        document: { expireDate: { not: null } },
      },
      select: {
        vehicleId: true,
        document: { select: { expireDate: true, type: true } },
      },
    });

    return rows
      .filter((row) => row.document?.expireDate)
      .map((row) => ({
        vehicleId: row.vehicleId,
        expireDate: row.document!.expireDate!,
        type: row.document!.type,
      }));
  };

  findExpensesSum = async (vehicleIds: string[], from: Date, to: Date): Promise<number> => {
    if (vehicleIds.length === 0) return 0;

    const result = await this.prisma.timelineEvent.aggregate({
      where: {
        vehicleId: { in: vehicleIds },
        deletedAt: null,
        cost: { not: null },
        type: { notIn: DASHBOARD_EXPENSE_EXCLUDED_TYPES },
        eventDate: { gte: from, lte: to },
      },
      _sum: { cost: true },
    });

    return Number(result._sum.cost ?? 0);
  };
}
