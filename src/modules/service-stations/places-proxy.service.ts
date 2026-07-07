import { BadRequestException, ErrorCodes } from '@common/exceptions';
import { AppConfigService } from '@config/config.service';
import { Injectable, Logger } from '@nestjs/common';

import { parseAddressComponents } from './lib';
import { PLACES_API } from './service-stations.constants';
import { PlaceAutocompleteSuggestion, PlaceDetailsResult } from './types';

@Injectable()
export class PlacesProxyService {
  private readonly logger = new Logger(PlacesProxyService.name);

  constructor(private readonly config: AppConfigService) {}

  async autocomplete(query: string, sessionToken: string): Promise<PlaceAutocompleteSuggestion[]> {
    const response = await fetch(`${PLACES_API.BASE_URL}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.config.googlePlacesApiKey,
        'X-Goog-FieldMask': PLACES_API.AUTOCOMPLETE_FIELD_MASK,
      },
      body: JSON.stringify({
        input: query,
        sessionToken,
        includedRegionCodes: [PLACES_API.DEFAULT_REGION],
        languageCode: PLACES_API.DEFAULT_LANGUAGE,
      }),
    });

    if (!response.ok) {
      this.logger.error(`Places autocomplete failed: ${response.status}`);
      throw new BadRequestException(ErrorCodes.General.BAD_REQUEST);
    }

    const data = await response.json();
    const suggestions = data.suggestions ?? [];

    return suggestions
      .filter((s: { placePrediction?: unknown }) => !!s.placePrediction)
      .map(
        (s: {
          placePrediction: {
            placeId: string;
            structuredFormat: { mainText: { text: string }; secondaryText?: { text: string } };
          };
        }) => ({
          placeId: s.placePrediction.placeId,
          primaryText: s.placePrediction.structuredFormat.mainText.text,
          secondaryText: s.placePrediction.structuredFormat.secondaryText?.text ?? '',
        }),
      );
  }

  async getDetails(placeId: string, sessionToken: string): Promise<PlaceDetailsResult> {
    const response = await fetch(
      `${PLACES_API.BASE_URL}/places/${placeId}?sessionToken=${sessionToken}`,
      {
        headers: {
          'X-Goog-Api-Key': this.config.googlePlacesApiKey,
          'X-Goog-FieldMask': PLACES_API.DETAILS_FIELD_MASK,
        },
      },
    );

    if (!response.ok) {
      this.logger.error(`Places details failed: ${response.status}`);
      throw new BadRequestException(ErrorCodes.General.BAD_REQUEST);
    }

    const place = await response.json();
    const address = parseAddressComponents(place.addressComponents ?? []);

    return {
      placeId: place.id,
      name: place.displayName?.text ?? '',
      address,
      formattedAddress: place.formattedAddress ?? '',
      latitude: place.location?.latitude ?? 0,
      longitude: place.location?.longitude ?? 0,
      phone: place.internationalPhoneNumber ?? null,
      website: place.websiteUri ?? null,
      rating: place.rating ?? null,
      googleTypes: place.types ?? [],
    };
  }
}
