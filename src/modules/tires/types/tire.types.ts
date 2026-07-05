export interface CreateTireInput {
  vehicleId: string;
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
