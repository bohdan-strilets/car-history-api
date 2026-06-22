import { TimelineType } from '@prisma/client';

export class TimelineEventResponseDto {
  declare id: string;
  declare vehicleId: string;
  declare type: TimelineType;
  declare title: string;
  declare eventDate: Date;
  declare mileage: number;
  declare cost: string | null;
  declare description: string | null;
  declare serviceStation: { id: string; name: string; type: string } | null;
  declare details: Record<string, unknown> | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}
