import type { WeatherType } from "../types/weather";

type OpenWeatherErrorResponse = { message?: string };

type OpenWeatherGeocodingCity = {
  name?: string;
  state?: string;
  country?: string;
};

const formatCityLabel = (c: OpenWeatherGeocodingCity) => {
  const name = c?.name?.trim();
  const state = c?.state?.trim();
  const country = c?.country?.trim();

  if (!name) return "";

  // Prefer: City, State (if present) / else City, Country
  if (state && state.length > 0) {
    return country ? `${name}, ${state}, ${country}` : `${name}, ${state}`;
  }

  return country ? `${name}, ${country}` : name;
};

export const getWeather = async (city: string): Promise<WeatherType> => {
  const API_KEY = import.meta.env.VITE_API_KEY;

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric`;

  const res = await fetch(url);

  if (!res.ok) {
    const err = (await res.json()) as OpenWeatherErrorResponse;
    throw new Error(err.message || "City not found");
  }

  return (await res.json()) as WeatherType;
};

// Autocomplete (partial matching) using OpenWeather geocoding API
export const searchCities = async (
  query: string,
  signal?: AbortSignal
): Promise<string[]> => {
  const API_KEY = import.meta.env.VITE_API_KEY;

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    query
  )}&limit=8&appid=${API_KEY}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    // Geocoding returns non-200 on invalid queries sometimes
    return [];
  }

  const results = (await res.json()) as OpenWeatherGeocodingCity[];

  const labels = (results || [])
    .map((r) => formatCityLabel(r))
    .filter((n) => typeof n === "string" && n.trim().length > 0);

  // Dedupe and keep stable order
  return Array.from(new Set(labels));
};

export const searchCitiesByCountry = async (
  cityQuery: string,
  country: string,
  signal?: AbortSignal
): Promise<string[]> => {
  const normalizedCity = cityQuery.trim();
  const normalizedCountry = country.trim();
  if (!normalizedCity || !normalizedCountry) return [];

  const API_KEY = import.meta.env.VITE_API_KEY;
  if (!API_KEY) {
    throw new Error("Missing API key: set VITE_API_KEY in your .env");
  }

  // Call geocoding with country appended.
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    `${normalizedCity}, ${normalizedCountry}`
  )}&limit=8&appid=${API_KEY}`;

  const res = await fetch(url, { signal });
  if (!res.ok) return [];

  const results = (await res.json()) as OpenWeatherGeocodingCity[];

  const countryNeedleLower = normalizedCountry.toLowerCase();

  const matchesCountry = (r: OpenWeatherGeocodingCity) => {
    const rCountryLower = (r?.country || "").trim().toLowerCase();
    if (rCountryLower) {
      // Exact match on returned `country` field.
      if (rCountryLower === countryNeedleLower) return true;

      // Some OpenWeather responses may include country codes/abbreviations.
      // We still try to match via the formatted label.
    }

    const labelLower = formatCityLabel(r).toLowerCase();
    return (
      labelLower.endsWith(`, ${countryNeedleLower}`) ||
      labelLower === countryNeedleLower
    );
  };

  // Primary filtering: keep only results that match the requested country.
  let filtered = (results || []).filter(matchesCountry);

  // Fallback: if strict filtering returns nothing, show the best candidates.
  // This fixes cases where OpenWeather returns a non-matching country string/format.
  if (filtered.length === 0) {
    filtered = (results || []).slice(0, 8);
  }

  const labels = filtered
    .map((r) => formatCityLabel(r))
    .filter((n) => typeof n === "string" && n.trim().length > 0);

  return Array.from(new Set(labels));
};





