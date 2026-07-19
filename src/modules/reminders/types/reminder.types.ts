import { ReminderStatus, ReminderType } from '@prisma/client';

export interface CreateReminderInput {
  vehicleId: string;
  createdBy?: string | null;
  maintenanceIntervalId?: string | null;
  documentId?: string | null;
  type: ReminderType;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  dueMileage?: number | null;
  status?: ReminderStatus;
}

export interface UpdateReminderInput {
  type?: ReminderType;
  title?: string;
  description?: string | null;
  dueDate?: Date | null;
  dueMileage?: number | null;
  status?: ReminderStatus;
  completedAt?: Date | null;
}
