import { ServiceStation } from '@prisma/client';

import { ServiceStationResponseDto } from '../dto';

export function toServiceStationResponse(station: ServiceStation): ServiceStationResponseDto {
  return {
    id: station.id,
    name: station.name,
    type: station.type,
    address: station.address as unknown as ServiceStationResponseDto['address'],
    latitude: station.latitude ? Number(station.latitude) : null,
    longitude: station.longitude ? Number(station.longitude) : null,
    phone: station.phone,
    website: station.website,
    notes: station.notes,
    isFavorite: station.isFavorite,
    lastVisitedAt: station.lastVisitedAt?.toISOString() ?? null,
    visitCount: station.visitCount,
    myRating: station.myRating,
    googlePlaceId: station.googlePlaceId,
    googleRating: station.googleRating?.toString() ?? null,
    photoUrl: station.photoUrl,
    createdAt: station.createdAt.toISOString(),
    updatedAt: station.updatedAt.toISOString(),
  };
}
