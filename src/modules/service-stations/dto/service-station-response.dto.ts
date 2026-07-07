import { ServiceStationType } from '@prisma/client';

export class ServiceStationAddressResponseDto {
  declare country: string;
  declare city: string;
  declare street: string;
  declare number: string;
  declare postCode: string | null;
}

export class ServiceStationResponseDto {
  declare id: string;
  declare name: string;
  declare type: ServiceStationType;
  declare address: ServiceStationAddressResponseDto;
  declare latitude: number | null;
  declare longitude: number | null;
  declare phone: string | null;
  declare website: string | null;
  declare notes: string | null;
  declare isFavorite: boolean;
  declare lastVisitedAt: string | null;
  declare visitCount: number;
  declare myRating: number | null;
  declare googlePlaceId: string | null;
  declare googleRating: string | null;
  declare photoUrl: string | null;
  declare createdAt: string;
  declare updatedAt: string;
}
