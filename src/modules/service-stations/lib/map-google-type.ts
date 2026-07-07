import { ServiceStationType } from '@prisma/client';

const GOOGLE_TYPE_MAP: Record<string, ServiceStationType> = {
  car_repair: ServiceStationType.MECHANIC,
  car_dealer: ServiceStationType.DEALERSHIP,
  gas_station: ServiceStationType.FUEL_STATION,
  car_wash: ServiceStationType.CAR_WASH,
  tire_shop: ServiceStationType.TIRE_SHOP,
};

export const mapGoogleTypeToServiceStationType = (googleTypes: string[]): ServiceStationType => {
  for (const type of googleTypes) {
    const mapped = GOOGLE_TYPE_MAP[type];
    if (mapped) return mapped;
  }
  return ServiceStationType.OTHER;
};
