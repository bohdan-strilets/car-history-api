import { ReminderStatus, ReminderType } from '@prisma/client';

export class ReminderResponseDto {
  declare id: string;
  declare vehicleId: string;
  declare maintenanceIntervalId: string | null;
  declare documentId: string | null;
  declare type: ReminderType;
  declare title: string;
  declare description: string | null;
  declare dueDate: string | null;
  declare dueMileage: number | null;
  declare status: ReminderStatus;
  declare completedAt: string | null;
  declare createdAt: string;
  declare updatedAt: string;
}
