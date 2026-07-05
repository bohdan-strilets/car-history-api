import { Tire } from '@prisma/client';

import { TireResponseDto } from '../dto';

export function toTireResponse(tire: Tire): TireResponseDto {
  return {
    id: tire.id,
    vehicleId: tire.vehicleId,
    brand: tire.brand,
    model: tire.model,
    type: tire.type,
    width: tire.width,
    aspectRatio: tire.aspectRatio,
    rimDiameter: tire.rimDiameter,
    price: tire.price?.toString() ?? null,
    status: tire.status,
    storageLocation: tire.storageLocation,
    mileageAtPurchase: tire.mileageAtPurchase,
    quantity: tire.quantity,
    purchaseAt: tire.purchaseAt?.toISOString() ?? null,
    createdAt: tire.createdAt.toISOString(),
    updatedAt: tire.updatedAt.toISOString(),
  };
}
