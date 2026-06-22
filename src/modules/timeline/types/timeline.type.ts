import {
  Charge,
  Document,
  Expense,
  Prisma,
  Purchase,
  Refuel,
  Sale,
  Service,
  ServiceCategory,
  ServiceStation,
  TimelineEvent,
  TimelineType,
  TireChange,
  Trip,
} from '@prisma/client';

import { mapTimelineEvent } from '../mappers';

// Shared types

export type TimelineEventWithRelations = TimelineEvent & {
  serviceStation: Pick<ServiceStation, 'id' | 'name' | 'type'> | null;
  refuel: Refuel | null;
  charge: Charge | null;
  service: Service | null;
  document: Document | null;
  expense: Expense | null;
  tireChange: TireChange | null;
  trip: Trip | null;
  purchase: Purchase | null;
  sale: Sale | null;
};

export type MappedTimelineEvent = ReturnType<typeof mapTimelineEvent>;

// Repository types

export type CreateTimelineEventInput = {
  // shared
  vehicleId: string;
  type: TimelineType;
  title: string;
  eventDate: Date;
  mileage: number;
  cost?: Prisma.Decimal | null;
  description?: string | null;
  serviceStationId?: string | null;

  // child
  refuel?: Prisma.RefuelCreateWithoutEventInput;
  charge?: Prisma.ChargeCreateWithoutEventInput;
  service?: {
    category: ServiceCategory;
    works: Prisma.InputJsonValue;
    parts: Prisma.InputJsonValue;
  };
  document?: Prisma.DocumentCreateWithoutEventInput;
  expense?: Prisma.ExpenseCreateWithoutEventInput;
  tireChange?: Prisma.TireChangeCreateWithoutEventInput;
  trip?: Prisma.TripCreateWithoutEventInput;
  purchase?: Prisma.PurchaseCreateWithoutEventInput;
  sale?: Prisma.SaleCreateWithoutEventInput;
};

export type UpdateTimelineEventInput = {
  title?: string;
  eventDate?: Date;
  mileage?: number;
  cost?: Prisma.Decimal | null;
  description?: string | null;
  serviceStationId?: string | null;
};
