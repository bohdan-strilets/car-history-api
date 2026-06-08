import { Prisma } from '@prisma/client';

export const timelineEventInclude = {
  serviceStation: {
    select: { id: true, name: true, type: true },
  },
  refuel: true,
  charge: true,
  service: true,
  document: true,
  expense: true,
  tireChange: true,
  trip: true,
  purchase: true,
  sale: true,
} satisfies Prisma.TimelineEventInclude;
