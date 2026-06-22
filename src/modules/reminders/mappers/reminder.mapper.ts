import { Reminder } from '@prisma/client';

import { ReminderResponseDto } from '../dto';

export function toReminderResponse(reminder: Reminder): ReminderResponseDto {
  return {
    id: reminder.id,
    vehicleId: reminder.vehicleId,
    maintenanceIntervalId: reminder.maintenanceIntervalId,
    documentId: reminder.documentId,
    type: reminder.type,
    title: reminder.title,
    description: reminder.description,
    dueDate: reminder.dueDate?.toISOString() ?? null,
    dueMileage: reminder.dueMileage,
    status: reminder.status,
    completedAt: reminder.completedAt?.toISOString() ?? null,
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString(),
  };
}
