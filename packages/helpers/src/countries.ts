export interface Country {
  name: {
    common: string;
    official: string;
    nativeName: {
      [languageCode: string]: {
        official: string;
        common: string;
      };
    };
  };
  tld: string[];
  cca2: string;
  ccn3: string;
  cca3: string;
  cioc: string;
  fifa: string;
  independent: boolean;
  status: string;
  unMember: boolean;
  currencies: {
    [currencyCode: string]: {
      name: string;
      symbol: string;
    };
  };
  idd: {
    root: string;
    suffixes: string[];
  };
  capital: string[];
  capitalInfo: {
    latlng: [number, number];
  };
  altSpellings: string[];
  region: string;
  subregion: string;
  continents: string[];
  languages: {
    [languageCode: string]: string;
  };
  translations: {
    [languageCode: string]: {
      official: string;
      common: string;
    };
  };
  latlng: [number, number];
  landlocked: boolean;
  borders: string[];
  area: number;
  demonyms: {
    [languageCode: string]: {
      f: string;
      m: string;
    };
  };
  flag: string;
  flags: {
    svg: string;
    png: string;
    alt: string;
  };
  coatOfArms: {
    svg: string;
    png: string;
  };
  population: number;
  maps: {
    googleMaps: string;
    openStreetMaps: string;
  };
  gini: Record<string, number>;
  car: {
    signs: string[];
    side: string;
  };
  postalCode: {
    format: string | null;
    regex: string | null;
  };
  startOfWeek: string;
  timezones: string[];
}

// First, let's define a helper type to get all possible paths in an object
type PathsToStringProps<T> = T extends object
  ? {
    [K in keyof T]-?: K extends string
      ? T[K] extends string | number | boolean | null
        ? K // Return simple keys as is
        : T[K] extends Array<infer R>
          ? R extends object
            ? `${K}` // For arrays of objects, just return the array property name
            : `${K}` // For primitive arrays, return the array property name
          : `${K}` | `${K}.${PathsToStringProps<T[K]>}` // For nested objects, recurse
      : never;
  }[keyof T]
  : never;

// Now create a type that represents all possible paths in the Country interface
type CountryField = PathsToStringProps<Country>;

const SERVICE_URL = 'https://country-wiky-production.up.railway.app';

export async function fetchCountry(code: string | null): Promise<Country | null> {
  if (code === null) return null;

  try {
    const response = await fetch(`${SERVICE_URL}/countries/alpha/${code.toLowerCase()}?fields=name,flag`);

    if (response.ok && response.status < 400) {
      const countryData = await response.json();
      return !!countryData.name ? countryData as Country : null;
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to fetch country information', error);
    return null;
  }
}

export async function fetchCountries(fields: CountryField[]): Promise<Country[]> {
  try {
    const fieldsParams = fields.length > 0 ? `?fields=${fields.join(',')}` : '';
    const response = await fetch(`${SERVICE_URL}/countries/${fieldsParams}`);

    if (response.ok && response.status < 400) {
      const countryData = await response.json();
      return countryData as Country[];
    } else {
      return [];
    }
  } catch (error) {
    console.error('❌ Failed to fetch countries information', error);
    return [];
  }
}
