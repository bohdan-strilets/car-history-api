export interface PlaceAutocompleteSuggestion {
  placeId: string;
  primaryText: string;
  secondaryText: string;
}

export interface PlaceDetailsResult {
  placeId: string;
  name: string;
  address: {
    country: string;
    city: string;
    street: string;
    number: string;
    postCode: string;
  };
  formattedAddress: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  rating: number | null;
  googleTypes: string[];
}
