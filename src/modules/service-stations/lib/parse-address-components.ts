interface GoogleAddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

export interface ParsedAddress {
  country: string;
  city: string;
  street: string;
  number: string;
  postCode?: string;
  [key: string]: string | undefined;
}

export const parseAddressComponents = (components: GoogleAddressComponent[]): ParsedAddress => {
  const findComponent = (type: string) =>
    components.find((c) => c.types.includes(type))?.longText ?? '';

  return {
    country: findComponent('country'),
    city: findComponent('locality') || findComponent('postal_town'),
    street: findComponent('route'),
    number: findComponent('street_number'),
    postCode: findComponent('postal_code') || undefined,
  };
};
