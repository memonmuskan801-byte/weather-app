export type WeatherType = {
  name: string;
  dt: number;
  timezone: number;
  visibility?: number;
  coord: {
    lat: number;
    lon: number;
  };
  sys?: {
    country?: string;
    sunrise?: number;
    sunset?: number;
  };
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg?: number;
  };
};

export type Unit = "metric" | "imperial";

export type ForecastApiItem = {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  pop?: number;
  dt_txt: string;
};

export type ForecastType = {
  city: {
    name: string;
    country: string;
    timezone: number;
  };
  list: ForecastApiItem[];
};

export type DailyForecast = {
  date: string;
  dayLabel: string;
  icon: string;
  description: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  wind: number;
  rainChance: number;
};

export type CitySuggestion = {
  id: string;
  label: string;
  name: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
};

export type SavedLocation = {
  id: string;
  label: string;
  city: string;
  country?: string;
  lat?: number;
  lon?: number;
  savedAt: number;
};
