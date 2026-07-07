export const PLACES_API = {
  BASE_URL: 'https://places.googleapis.com/v1',
  AUTOCOMPLETE_FIELD_MASK:
    'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
  DETAILS_FIELD_MASK:
    'id,displayName,formattedAddress,addressComponents,location,internationalPhoneNumber,websiteUri,rating,types',
  DEFAULT_REGION: 'pl',
  DEFAULT_LANGUAGE: 'pl',
} as const;
