import { ServiceStationType } from '@prisma/client';

import { ParsedAddress } from '../lib';

export interface CreateServiceStationInput {
  userId: string;
  name: string;
  type: ServiceStationType;
  address: ParsedAddress;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  googlePlaceId: string | null;
  googleRating: number | null;
}

export interface UpdateServiceStationInput {
  name?: string;
  type?: ServiceStationType;
  address?: ParsedAddress;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
  myRating?: number | null;
}
