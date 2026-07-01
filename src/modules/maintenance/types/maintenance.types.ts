import { MaintenanceStatus, MaintenanceType } from '@prisma/client';

export interface CreateMaintenanceInput {
  vehicleId: string;
  type: MaintenanceType;
  title: string;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  lastServiceMileage?: number | null;
  lastServiceDate?: Date | null;
  nextServiceMileage?: number | null;
  nextServiceDate?: Date | null;
  status?: MaintenanceStatus;
}

export interface UpdateMaintenanceInput {
  type?: MaintenanceType;
  title?: string;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  lastServiceMileage?: number | null;
  lastServiceDate?: Date | null;
  nextServiceMileage?: number | null;
  nextServiceDate?: Date | null;
  status?: MaintenanceStatus;
}
