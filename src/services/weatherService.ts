import type {
  CitySuggestion,
  ForecastType,
  Unit,
  WeatherType,
} from "../types/weather";

type OpenWeatherErrorResponse = { message?: string };

type OpenWeatherGeocodingCity = {
  name?: string;
  state?: string;
  country?: string;
  lat?: number;
  lon?: number;
};

const CACHE_TTL = 10 * 60 * 1000;
const memoryCache = new Map<string, { expiresAt: number; value: unknown }>();

const getApiKey = () => {
  const API_KEY = import.meta.env.VITE_API_KEY;
  if (!API_KEY) {
    throw new Error("Missing API key: set VITE_API_KEY in your .env file");
  }
  return API_KEY;
};

const fetchJson = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const cached = memoryCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const res = await fetch(url, { signal });

  if (!res.ok) {
    let message = "Weather request failed";
    try {
      const err = (await res.json()) as OpenWeatherErrorResponse;
      message = err.message || message;
    } catch {
      message = res.statusText || message;
    }
    throw new Error(message);
  }

  const value = (await res.json()) as T;
  memoryCache.set(url, { expiresAt: Date.now() + CACHE_TTL, value });
  return value;
};

const formatCityLabel = (c: OpenWeatherGeocodingCity) => {
  const name = c?.name?.trim();
  const state = c?.state?.trim();
  const country = c?.country?.trim();

  if (!name) return "";
  if (state) return country ? `${name}, ${state}, ${country}` : `${name}, ${state}`;
  return country ? `${name}, ${country}` : name;
};

const toCitySuggestion = (city: OpenWeatherGeocodingCity): CitySuggestion | null => {
  if (!city.name || typeof city.lat !== "number" || typeof city.lon !== "number") {
    return null;
  }

  return {
    id: `${city.name}-${city.state || ""}-${city.country || ""}-${city.lat}-${city.lon}`.toLowerCase(),
    label: formatCityLabel(city),
    name: city.name,
    state: city.state,
    country: city.country,
    lat: city.lat,
    lon: city.lon,
  };
};

export const getWeather = async (
  city: string,
  units: Unit = "metric",
  signal?: AbortSignal
): Promise<WeatherType> => {
  const API_KEY = getApiKey();
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=${units}`;

  return fetchJson<WeatherType>(url, signal);
};

export const getForecast = async (
  city: string,
  units: Unit = "metric",
  signal?: AbortSignal
): Promise<ForecastType> => {
  const API_KEY = getApiKey();
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=${units}`;

  return fetchJson<ForecastType>(url, signal);
};

export const getWeatherByCoords = async (
  lat: number,
  lon: number,
  units: Unit = "metric",
  signal?: AbortSignal
): Promise<WeatherType> => {
  const API_KEY = getApiKey();
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;

  return fetchJson<WeatherType>(url, signal);
};

export const getForecastByCoords = async (
  lat: number,
  lon: number,
  units: Unit = "metric",
  signal?: AbortSignal
): Promise<ForecastType> => {
  const API_KEY = getApiKey();
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`;

  return fetchJson<ForecastType>(url, signal);
};

export const reverseGeocode = async (
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<string> => {
  const API_KEY = getApiKey();
  const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
  const results = await fetchJson<OpenWeatherGeocodingCity[]>(url, signal);

  return formatCityLabel(results[0]) || "Current location";
};

export const searchCitiesByCountry = async (
  cityQuery: string,
  country: string,
  signal?: AbortSignal
): Promise<CitySuggestion[]> => {
  const normalizedCity = cityQuery.trim();
  const normalizedCountry = country.trim();
  if (!normalizedCity || !normalizedCountry) return [];

  const API_KEY = getApiKey();
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    `${normalizedCity}, ${normalizedCountry}`
  )}&limit=8&appid=${API_KEY}`;

  const results = await fetchJson<OpenWeatherGeocodingCity[]>(url, signal);
  const countryNeedleLower = normalizedCountry.toLowerCase();

  const matchesCountry = (r: OpenWeatherGeocodingCity) => {
    const rCountryLower = (r?.country || "").trim().toLowerCase();
    if (rCountryLower && rCountryLower === countryNeedleLower) return true;

    const labelLower = formatCityLabel(r).toLowerCase();
    return (
      labelLower.endsWith(`, ${countryNeedleLower}`) ||
      labelLower === countryNeedleLower
    );
  };

  const filtered = results.filter(matchesCountry);
  const candidates = filtered.length > 0 ? filtered : results.slice(0, 8);
  const suggestions = candidates
    .map((r) => toCitySuggestion(r))
    .filter((item): item is CitySuggestion => Boolean(item));

  return Array.from(
    new Map(suggestions.map((item) => [item.id, item])).values()
  );
};
