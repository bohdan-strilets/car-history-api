import { VehiclePurchaseInfo } from '@modules/vehicles';
import { TimelineType } from '@prisma/client';

export type MilestoneCondition = {
  type: string;
  value?: number;
  eventType?: TimelineType;
};

export type CheckContext = {
  userId: string;
  vehicleId: string;
  eventType?: TimelineType;
  mileage?: number;
  cost?: number;
};

export type VehicleContext = {
  currentMileage: number;
  registrationMileage: number;
  purchaseInfo: VehiclePurchaseInfo | null;
};

export type MilestoneResult = {
  achieved: boolean;
  value: number;
};

export type VehicleLatestMilestoneInfo = {
  code: string;
  title: string;
  category: string;
};
