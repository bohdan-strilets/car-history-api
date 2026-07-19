export interface CreateTireInput {
  vehicleId: string;
  createdBy?: string | null;
  brand: string;
  model: string;
  type: string;
  width: number;
  aspectRatio: number;
  rimDiameter: number;
  price: number | null;
  status: string;
  storageLocation: string | null;
  mileageAtPurchase: number | null;
  quantity: number;
  purchaseAt: Date | null;
}

export interface UpdateTireInput {
  brand?: string;
  model?: string;
  type?: string;
  width?: number;
  aspectRatio?: number;
  rimDiameter?: number;
  price?: number | null;
  storageLocation?: string | null;
  mileageAtPurchase?: number | null;
  quantity?: number;
  purchaseAt?: Date | null | undefined;
  status?: string;
}

export interface TirePeriod {
  installedAt: string;
  installedMileage: number | null;
  removedAt: string | null;
  removedMileage: number | null;
  kmDriven: number | null;
  daysDriven: number | null;
  isOngoing: boolean;
}

export interface TireHistory {
  periods: TirePeriod[];
  totalKmDriven: number;
  totalMountCount: number;
}
