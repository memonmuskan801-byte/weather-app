import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  COUNTRY_CITIES,
  COUNTRY_NAMES,
  getCitySuggestions,
} from "./data/countryCities";
import {
  getForecastByCoords,
  getWeatherByCoords,
  reverseGeocode,
} from "./services/weatherService";
import type {
  CitySuggestion,
  DailyForecast,
  ForecastApiItem,
  ForecastType,
  Unit,
  WeatherType,
} from "./types/weather";

type HourForecast = {
  time: string;
  icon: string;
  temp: number;
};

type WeatherKind = "sunny" | "cloudy" | "snow" | "fog" | "rainy" | "storm";

const sampleWeekly = [
  { dayLabel: "Wednesday", icon: "04d", description: "broken clouds", tempMax: 22, tempMin: 18, humidity: 64, wind: 4.3, rainChance: 47 },
  { dayLabel: "Thursday", icon: "01d", description: "clear sky", tempMax: 21, tempMin: 17, humidity: 60, wind: 3.58, rainChance: 31 },
  { dayLabel: "Friday", icon: "04d", description: "overcast clouds", tempMax: 21, tempMin: 16, humidity: 58, wind: 1.92, rainChance: 90 },
  { dayLabel: "Saturday", icon: "04d", description: "overcast clouds", tempMax: 21, tempMin: 16, humidity: 59, wind: 2.75, rainChance: 77 },
  { dayLabel: "Sunday", icon: "01d", description: "clear sky", tempMax: 23, tempMin: 18, humidity: 60, wind: 1.99, rainChance: 38 },
  { dayLabel: "Monday", icon: "02d", description: "few clouds", tempMax: 23, tempMin: 18, humidity: 59, wind: 2.86, rainChance: 20 },
];

const sampleHours: HourForecast[] = [
  { time: "2 PM", icon: "01d", temp: 40 },
  { time: "5 PM", icon: "02d", temp: 39 },
  { time: "8 PM", icon: "02n", temp: 36 },
];

const getDayKey = (item: ForecastApiItem, timezone: number) =>
  new Date((item.dt + timezone) * 1000).toISOString().slice(0, 10);

const formatDateTime = (date: Date, timezone?: number) => {
  const displayDate =
    typeof timezone === "number"
      ? new Date((Math.floor(date.getTime() / 1000) + timezone) * 1000)
      : date;
  const timeZone = typeof timezone === "number" ? "UTC" : undefined;
  const dateParts = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone,
  }).formatToParts(displayDate);
  const weekday = dateParts.find((part) => part.type === "weekday")?.value || "";
  const day = dateParts.find((part) => part.type === "day")?.value || "";
  const month = dateParts.find((part) => part.type === "month")?.value || "";
  const year = dateParts.find((part) => part.type === "year")?.value || "";
  const timeLabel = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone,
  })
    .format(displayDate)
    .replace(/^0/, "");

  return `${weekday} ${day}-${month}-${year} ${timeLabel}`;
};

const formatCityDate = (timestamp?: number, timezone = 0) => {
  const date = timestamp ? new Date((timestamp + timezone) * 1000) : new Date();
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: timestamp ? "UTC" : undefined,
  }).format(date);
};

const formatPlaceLabel = (city: CitySuggestion, country: string) =>
  [city.name, city.state, country].filter(Boolean).join(", ");

const countryCodeNames: Record<string, string> = {
  PK: "Pakistan",
};

const hasNonEnglishText = (value: string) => /[^\x00-\x7F]/.test(value);

const findKnownPlaceLabel = (weather: WeatherType | null) => {
  if (!weather) return "";

  let nearest = {
    country: "",
    city: null as { name: string; state?: string } | null,
    distance: Number.POSITIVE_INFINITY,
  };

  Object.entries(COUNTRY_CITIES).forEach(([country, cities]) => {
    cities.forEach((city) => {
      const distance =
        Math.abs(city.lat - weather.coord.lat) +
        Math.abs(city.lon - weather.coord.lon);

      if (distance < nearest.distance) {
        nearest = { country, city, distance };
      }
    });
  });

  if (!nearest.city || nearest.distance > 1) return "";
  return [nearest.city.name, nearest.city.state, nearest.country]
    .filter(Boolean)
    .join(", ");
};

const cleanPlaceLabel = (label: string, weather: WeatherType | null) => {
  const knownPlace = findKnownPlaceLabel(weather);
  if (hasNonEnglishText(label) && knownPlace) return knownPlace;

  return label
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      return countryCodeNames[trimmed] || trimmed;
    })
    .filter((part) => part && !hasNonEnglishText(part))
    .join(", ");
};

const formatHour = (timestamp: number, timezone: number) =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    hour12: true,
    timeZone: "UTC",
  })
    .format(new Date((timestamp + timezone) * 1000))
    .replace(" ", " ");

const buildDailyForecast = (forecast: ForecastType | null): DailyForecast[] => {
  if (!forecast) return [];

  const groups = new Map<string, ForecastApiItem[]>();
  forecast.list.forEach((item) => {
    const key = getDayKey(item, forecast.city.timezone);
    const values = groups.get(key) || [];
    values.push(item);
    groups.set(key, values);
  });

  return Array.from(groups.entries())
    .slice(0, 6)
    .map(([date, items]) => {
      const midday =
        items.find((item) => item.dt_txt.includes("12:00:00")) ||
        items[Math.floor(items.length / 2)];

      return {
        date,
        dayLabel: new Intl.DateTimeFormat("en", { weekday: "long" }).format(
          new Date(`${date}T12:00:00`)
        ),
        icon: midday.weather[0].icon,
        description: midday.weather[0].description,
        tempMin: Math.min(...items.map((item) => item.main.temp_min)),
        tempMax: Math.max(...items.map((item) => item.main.temp_max)),
        humidity: Math.round(
          items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length
        ),
        wind: Number(
          (
            items.reduce((sum, item) => sum + item.wind.speed, 0) / items.length
          ).toFixed(2)
        ),
        rainChance: Math.round(
          Math.max(...items.map((item) => item.pop || 0)) * 100
        ),
      };
    });
};

const buildHourlyForecast = (forecast: ForecastType | null): HourForecast[] => {
  if (!forecast) return [];

  return forecast.list.slice(0, 3).map((item) => ({
    time: formatHour(item.dt, forecast.city.timezone),
    icon: item.weather[0].icon,
    temp: item.main.temp,
  }));
};

const getCurrentPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 5 * 60 * 1000,
    });
  });

export default function App() {
  const [unit, setUnit] = useState<Unit>("metric");
  const [clock, setClock] = useState(() => new Date());
  const [countryQuery, setCountryQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryIndex, setCountryIndex] = useState(0);

  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityIndex, setCityIndex] = useState(0);

  const [weather, setWeather] = useState<WeatherType | null>(null);
  const [forecast, setForecast] = useState<ForecastType | null>(null);
  const [placeLabel, setPlaceLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const unitLabel = unit === "metric" ? "C" : "F";
  const dailyForecast = useMemo(() => buildDailyForecast(forecast), [forecast]);
  const hourlyForecast = useMemo(() => buildHourlyForecast(forecast), [forecast]);

  const countryOptions = useMemo(() => {
    const needle = countryQuery.trim().toLowerCase();
    return COUNTRY_NAMES.filter((country) =>
      country.toLowerCase().includes(needle)
    );
  }, [countryQuery]);

  const cityOptions = useMemo(
    () => getCitySuggestions(selectedCountry, cityQuery),
    [selectedCountry, cityQuery]
  );

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadWeather = async (
    location: { lat: number; lon: number; label: string },
    nextUnit: Unit = unit
  ) => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");

    try {
      const [weatherResult, forecastResult] = await Promise.all([
        getWeatherByCoords(location.lat, location.lon, nextUnit, controller.signal),
        getForecastByCoords(location.lat, location.lon, nextUnit, controller.signal),
      ]);

      setWeather(weatherResult);
      setForecast(forecastResult);
      setPlaceLabel(location.label);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Something went wrong. Please try another city.");
    } finally {
      setLoading(false);
    }
  };

  const selectCountry = (country: string) => {
    setSelectedCountry(country);
    setCountryQuery(country);
    setCountryOpen(false);
    setCountryIndex(0);
    setCityQuery("");
    setSelectedCity(null);
    setCityOpen(true);
    setCityIndex(0);
    setWeather(null);
    setForecast(null);
    setPlaceLabel("");
    setError("");
  };

  const selectCity = (city: CitySuggestion) => {
    setSelectedCity(city);
    setCityQuery(city.name);
    setCityOpen(false);
    setCityIndex(0);
    void loadWeather({
      lat: city.lat,
      lon: city.lon,
      label: formatPlaceLabel(city, selectedCountry),
    });
  };

  const submitSearch = () => {
    if (!selectedCountry) {
      setError("Please select a country first.");
      return;
    }

    const city = selectedCity || cityOptions[0];
    if (!city) {
      setError("No matching city found.");
      return;
    }

    selectCity(city);
  };

  const handleMyLocation = async () => {
    setGeoLoading(true);
    setError("");

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const label = await reverseGeocode(latitude, longitude);
      await loadWeather({ lat: latitude, lon: longitude, label });
    } catch {
      setError("Location permission failed. Search by country and city instead.");
    } finally {
      setGeoLoading(false);
    }
  };

  const changeUnit = (nextUnit: Unit) => {
    setUnit(nextUnit);

    if (weather) {
      void loadWeather(
        {
          lat: weather.coord.lat,
          lon: weather.coord.lon,
          label: placeLabel || weather.name,
        },
        nextUnit
      );
    }
  };

  const condition = weather?.weather[0];
  const weeklyItems = dailyForecast.length ? dailyForecast : sampleWeekly;
  const todayItems = hourlyForecast.length ? hourlyForecast : sampleHours;

  return (
    <main className="min-h-screen bg-[#F6F4E8] px-3 py-4 font-bold text-[#050505] sm:px-6 sm:py-8">
      <section className="mx-auto min-h-[calc(100vh-2rem)] max-w-[1380px] overflow-hidden rounded-none border border-white/80 bg-[#F2EAD3] px-5 py-5 shadow-2xl shadow-[#DC9B9B]/25 sm:min-h-[calc(100vh-4rem)] sm:rounded-b-2xl sm:px-8 md:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_center,#DC9B9B_0_2px,transparent_3px)] [background-size:72px_72px]" />

        <div className="relative z-10">
          <header className="mb-5 flex items-center justify-between gap-4">
            <div className="leading-none">
              <p className="text-lg font-black uppercase tracking-tight text-[#050505] sm:text-2xl">
                The Weather
              </p>
              <p className="-mt-1 text-lg font-black uppercase tracking-tight text-[#537D96] sm:text-2xl">
                Forecasting
              </p>
            </div>

            <p className="text-center text-lg font-black text-[#050505] sm:text-2xl">
              {formatDateTime(clock, weather?.timezone)}
            </p>

            <button
              className="grid h-10 w-10 place-items-center rounded-full bg-[#F6F4E8] text-xl font-black text-[#050505] transition hover:bg-white"
              onClick={() => void handleMyLocation()}
              title="Use my location"
              type="button"
            >
              {geoLoading ? "..." : "◎"}
            </button>
          </header>

          <section className="mb-12 grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
            <SearchBox
              activeIndex={countryIndex}
              disabled={false}
              emptyText="No country found"
              onChange={(value) => {
                setCountryQuery(value);
                setSelectedCountry("");
                setCountryOpen(true);
                setCountryIndex(0);
                setCityQuery("");
                setSelectedCity(null);
                setWeather(null);
                setForecast(null);
              }}
              onClear={() => {
                setCountryQuery("");
                setSelectedCountry("");
                setCountryOpen(false);
                setCityQuery("");
                setSelectedCity(null);
                setWeather(null);
                setForecast(null);
              }}
              onFocus={() => setCountryOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setCountryOpen(true);
                  setCountryIndex((index) =>
                    Math.min(index + 1, countryOptions.length - 1)
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setCountryIndex((index) => Math.max(index - 1, 0));
                }
                if (event.key === "Enter" && countryOptions[countryIndex]) {
                  event.preventDefault();
                  selectCountry(countryOptions[countryIndex]);
                }
                if (event.key === "Escape") setCountryOpen(false);
              }}
              onSelect={selectCountry}
              open={countryOpen}
              options={countryOptions}
              placeholder="Country"
              value={countryQuery}
            />

            <SearchBox
              activeIndex={cityIndex}
              disabled={!selectedCountry}
              emptyText="No city found"
              onChange={(value) => {
                setCityQuery(value);
                setSelectedCity(null);
                setCityOpen(true);
                setCityIndex(0);
              }}
              onClear={() => {
                setCityQuery("");
                setSelectedCity(null);
                setCityOpen(Boolean(selectedCountry));
              }}
              onFocus={() => setCityOpen(Boolean(selectedCountry))}
              onKeyDown={(event) => {
                if (!selectedCountry) return;
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setCityOpen(true);
                  setCityIndex((index) =>
                    Math.min(index + 1, cityOptions.length - 1)
                  );
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setCityIndex((index) => Math.max(index - 1, 0));
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (cityOptions[cityIndex]) selectCity(cityOptions[cityIndex]);
                  else submitSearch();
                }
                if (event.key === "Escape") setCityOpen(false);
              }}
              onSelect={(label) => {
                const city = cityOptions.find((item) => item.label === label);
                if (city) selectCity(city);
              }}
              open={cityOpen}
              options={cityOptions.map((city) => city.label)}
              placeholder={selectedCountry ? "City" : "Select country first"}
              value={cityQuery}
            />

            <button
              className="h-12 rounded-[4px] border border-[#537D96]/25 bg-[#537D96] px-6 font-black text-white shadow-sm transition hover:bg-[#466b80] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !selectedCountry}
              onClick={submitSearch}
              type="button"
            >
              {loading ? "Loading..." : "Search"}
            </button>

            <div className="flex h-12 rounded-[4px] border border-[#537D96]/25 bg-[#E5EEE4] p-1 shadow-sm">
              <button
                className={`w-10 rounded-[3px] font-black transition ${unit === "metric" ? "bg-[#537D96] text-white" : "text-[#050505] hover:bg-[#C8F2EF]"}`}
                onClick={() => changeUnit("metric")}
                type="button"
              >
                C
              </button>
              <button
                className={`w-10 rounded-[3px] font-black transition ${unit === "imperial" ? "bg-[#537D96] text-white" : "text-[#050505] hover:bg-[#C8F2EF]"}`}
                onClick={() => changeUnit("imperial")}
                type="button"
              >
                F
              </button>
            </div>
          </section>

          {error && (
            <div className="mx-auto mb-8 max-w-lg rounded-lg bg-[#DC9B9B]/30 px-4 py-3 text-center text-sm font-semibold text-[#7b3e3e]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid min-h-[500px] place-items-center">
              <div className="rounded-xl bg-[#F6F4E8]/85 px-8 py-6 text-center shadow-xl">
                <p className="text-4xl">☁</p>
                <p className="mt-3 text-sm font-black text-[#050505]">
                  Loading...
                </p>
              </div>
            </div>
          ) : (
            <section className="grid gap-10 lg:grid-cols-2">
              <div>
                <SectionTitle>Current Weather</SectionTitle>
                <CurrentWeather
                  data={weather}
                  description={condition?.description}
                  placeLabel={cleanPlaceLabel(placeLabel, weather)}
                  unitLabel={unitLabel}
                />

                <SectionTitle className="mt-12">Air Conditions</SectionTitle>
                <AirConditions data={weather} unitLabel={unitLabel} />

                <SectionTitle className="mt-12">Today's Forecast</SectionTitle>
                <p className="mb-5 text-center text-base font-black uppercase tracking-wide text-[#050505]">
                  {todayItems.length} Forecasts Available
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {todayItems.map((item) => (
                    <HourCard key={item.time} item={item} unitLabel={unitLabel} />
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle>Weekly Forecast</SectionTitle>
                <div className="space-y-1.5">
                  {weeklyItems.map((day) => (
                    <WeeklyRow
                      day={day}
                      key={day.dayLabel}
                      unitLabel={unitLabel}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function SearchBox({
  activeIndex,
  disabled,
  emptyText,
  onChange,
  onClear,
  onFocus,
  onKeyDown,
  onSelect,
  open,
  options,
  placeholder,
  value,
}: {
  activeIndex: number;
  disabled: boolean;
  emptyText: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onFocus: () => void;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  onSelect: (value: string) => void;
  open: boolean;
  options: string[];
  placeholder: string;
  value: string;
}) {
  return (
    <div className="relative">
      <input
        autoComplete="off"
        className="h-12 w-full rounded-[4px] border border-[#537D96]/25 bg-[#E5EEE4] px-4 pr-10 text-lg font-black text-[#050505] shadow-sm outline-none placeholder:text-[#050505]/55 focus:border-[#537D96] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        value={value}
      />
      {value && (
        <button
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded font-black text-[#050505] hover:bg-[#E5EEE4]"
          onClick={onClear}
          type="button"
        >
          ×
        </button>
      )}
      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-[4px] border border-[#537D96]/20 bg-[#E5EEE4] p-1 shadow-2xl">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm font-black text-[#050505]">{emptyText}</p>
          ) : (
            options.map((option, index) => (
              <button
                className={`block w-full rounded px-3 py-2 text-left text-sm ${
                  index === activeIndex
                    ? "bg-[#C0E1D2] text-[#050505]"
                    : "text-[#050505] hover:bg-[#E5EEE4]"
                }`}
                key={option}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(option)}
                type="button"
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`mb-7 text-center text-2xl font-black uppercase tracking-tight text-[#050505] ${className}`}
    >
      {children}
    </h2>
  );
}

const getWeatherKind = (icon = "", description = ""): WeatherKind => {
  const text = `${icon} ${description}`.toLowerCase();

  if (text.includes("11") || text.includes("thunder") || text.includes("storm")) {
    return "storm";
  }
  if (text.includes("13") || text.includes("snow")) return "snow";
  if (text.includes("50") || text.includes("fog") || text.includes("mist") || text.includes("haze")) {
    return "fog";
  }
  if (text.includes("09") || text.includes("10") || text.includes("rain") || text.includes("drizzle")) {
    return "rainy";
  }
  if (text.includes("01n") || text.includes("02n")) {
    return "cloudy";
  }
  if (text.includes("01") || text.includes("clear") || text.includes("sun")) {
    return "sunny";
  }

  return "cloudy";
};

function WeatherIcon({
  className = "",
  description = "",
  icon = "",
}: {
  className?: string;
  description?: string;
  icon?: string;
}) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const kind = getWeatherKind(icon, description);
  const sunGrad = `sun-${rawId}`;
  const cloudGrad = `cloud-${rawId}`;
  const rainGrad = `rain-${rawId}`;
  const boltGrad = `bolt-${rawId}`;

  return (
    <svg
      aria-label={description || kind}
      className={className}
      role="img"
      viewBox="0 0 140 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient cx="45%" cy="35%" id={sunGrad} r="65%">
          <stop offset="0%" stopColor="#fff47a" />
          <stop offset="48%" stopColor="#ffc42e" />
          <stop offset="100%" stopColor="#ff6b2c" />
        </radialGradient>
        <linearGradient id={cloudGrad} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="58%" stopColor="#f3f5fb" />
          <stop offset="100%" stopColor="#9aa3b2" />
        </linearGradient>
        <linearGradient id={rainGrad} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5ca8ff" />
          <stop offset="100%" stopColor="#2553ff" />
        </linearGradient>
        <linearGradient id={boltGrad} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffe66d" />
          <stop offset="100%" stopColor="#ff6735" />
        </linearGradient>
        <filter id={`shadow-${rawId}`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" floodColor="#000000" floodOpacity="0.28" stdDeviation="5" />
        </filter>
      </defs>

      {kind === "sunny" && (
        <g filter={`url(#shadow-${rawId})`}>
          {Array.from({ length: 12 }).map((_, index) => {
            const angle = (index * 30 * Math.PI) / 180;
            const x1 = 70 + Math.cos(angle) * 35;
            const y1 = 58 + Math.sin(angle) * 35;
            const x2 = 70 + Math.cos(angle) * 49;
            const y2 = 58 + Math.sin(angle) * 49;
            return (
              <line
                key={index}
                stroke="#ffc52f"
                strokeLinecap="round"
                strokeWidth="7"
                x1={x1}
                x2={x2}
                y1={y1}
                y2={y2}
              />
            );
          })}
          <circle cx="70" cy="58" fill={`url(#${sunGrad})`} r="29" />
        </g>
      )}

      {(kind === "cloudy" || kind === "snow") && (
        <g filter={`url(#shadow-${rawId})`}>
          <circle cx="91" cy="38" fill={`url(#${sunGrad})`} r="24" />
          <Cloud fill={`url(#${cloudGrad})`} />
        </g>
      )}

      {(kind === "rainy" || kind === "storm" || kind === "fog") && (
        <g filter={`url(#shadow-${rawId})`}>
          <Cloud fill={`url(#${cloudGrad})`} />
        </g>
      )}

      {kind === "snow" && (
        <g stroke="#f7f9ff" strokeLinecap="round" strokeWidth="5">
          <line x1="45" x2="45" y1="80" y2="96" />
          <line x1="37" x2="53" y1="88" y2="88" />
          <line x1="39" x2="51" y1="82" y2="94" />
          <line x1="51" x2="39" y1="82" y2="94" />
          <line x1="86" x2="86" y1="81" y2="101" />
          <line x1="76" x2="96" y1="91" y2="91" />
          <line x1="79" x2="93" y1="84" y2="98" />
          <line x1="93" x2="79" y1="84" y2="98" />
        </g>
      )}

      {kind === "rainy" && <Rain fill={`url(#${rainGrad})`} />}

      {kind === "storm" && (
        <>
          <Rain fill={`url(#${rainGrad})`} />
          <path d="M66 63h22L73 88h18l-32 30 9-24H52z" fill={`url(#${boltGrad})`} />
        </>
      )}

      {kind === "fog" && (
        <g fill="none" strokeLinecap="round" strokeWidth="7">
          <path d="M14 75h58c10 0 13 10 4 15H18" stroke="#79c3ff" />
          <path d="M30 92h70c10 0 13 10 4 15H42" stroke="#367cff" />
          <path d="M8 104h52c8 0 10 8 3 12H18" stroke="#67b8ff" />
        </g>
      )}
    </svg>
  );
}

function Cloud({ fill }: { fill: string }) {
  return (
    <g>
      <ellipse cx="70" cy="67" fill={fill} rx="43" ry="24" />
      <circle cx="48" cy="58" fill={fill} r="22" />
      <circle cx="72" cy="46" fill={fill} r="28" />
      <circle cx="98" cy="59" fill={fill} r="20" />
      <rect fill={fill} height="28" rx="14" width="88" x="27" y="58" />
    </g>
  );
}

function Rain({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <ellipse cx="43" cy="91" rx="6" ry="11" transform="rotate(17 43 91)" />
      <ellipse cx="70" cy="99" rx="6" ry="12" transform="rotate(17 70 99)" />
      <ellipse cx="96" cy="89" rx="6" ry="11" transform="rotate(17 96 89)" />
    </g>
  );
}

function CurrentWeather({
  data,
  description,
  placeLabel,
  unitLabel,
}: {
  data: WeatherType | null;
  description?: string;
  placeLabel: string;
  unitLabel: "C" | "F";
}) {
  const icon = data?.weather[0]?.icon || "02d";

  return (
    <div className="grid items-center gap-6 rounded-xl bg-[#C8F2EF] px-5 py-6 text-center shadow-lg shadow-[#C0E1D2]/60 sm:grid-cols-3">
      <div className="mx-auto w-full max-w-xs border-b-2 border-[#537D96]/35 pb-3">
        <p className="text-xl font-black">
          {data ? placeLabel || data.name : "London, GB"}
        </p>
        <p className="mt-1 text-base font-black text-[#050505]">
          {formatCityDate(data?.dt, data?.timezone)}
        </p>
      </div>
      <div>
        <p className="text-xl font-black">
          {data ? Math.round(data.main.temp) : 22} °{unitLabel}
        </p>
        <p className="mt-1 text-base font-black text-[#050505]">
          {description || "scattered clouds"}
        </p>
      </div>
      <WeatherIcon
        className="mx-auto h-28 w-28"
        description={description || "weather"}
        icon={icon}
      />
    </div>
  );
}

function AirConditions({
  data,
  unitLabel,
}: {
  data: WeatherType | null;
  unitLabel: "C" | "F";
}) {
  const items = [
    ["♨", "Real Feel", `${data ? Math.round(data.main.feels_like) : 22} °${unitLabel}`],
    ["≋", "Wind", `${data ? data.wind.speed.toFixed(2) : "6.69"} ${unitLabel === "C" ? "m/s" : "mph"}`],
    ["☁", "Clouds", `${data ? data.weather[0]?.main || "Clouds" : "40"}${data ? "" : " %"}`],
    ["♒", "Humidity", `${data ? data.main.humidity : 70} %`],
  ];

  return (
    <div className="grid gap-5 text-center sm:grid-cols-4">
      {items.map(([icon, label, value]) => (
        <div key={label}>
          <p className="text-lg font-black text-[#050505]">
            <span className="mr-2 text-[#DC9B9B]">{icon}</span>
            {label}
          </p>
          <p className="mt-5 text-2xl font-extrabold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function HourCard({
  item,
  unitLabel,
}: {
  item: HourForecast;
  unitLabel: "C" | "F";
}) {
  return (
    <article className="w-28 rounded-lg bg-[#F6F4E8]/85 px-4 py-3 text-center shadow-lg shadow-[#C0E1D2]/50 backdrop-blur-sm first:bg-[#DC9B9B]/35">
      <p className="text-sm font-black text-[#050505]">{item.time}</p>
      <WeatherIcon className="mx-auto h-16 w-16" icon={item.icon} />
      <p className="text-lg font-extrabold">
        {Math.round(item.temp)} °{unitLabel}
      </p>
    </article>
  );
}

function WeeklyRow({
  day,
  unitLabel,
}: {
  day: Pick<
    DailyForecast,
    "dayLabel" | "icon" | "description" | "tempMax" | "humidity" | "wind" | "rainChance"
  >;
  unitLabel: "C" | "F";
}) {
  return (
    <article className="grid items-center gap-3 rounded-lg bg-[#F6F4E8]/75 px-5 py-3 shadow-md shadow-[#C0E1D2]/45 backdrop-blur-sm sm:grid-cols-[1.2fr_1.4fr_0.85fr_0.85fr]">
      <div>
        <p className="text-lg font-extrabold">{day.dayLabel}</p>
        <div className="mt-1 flex items-center gap-2 font-black text-[#050505]">
          <WeatherIcon
            className="h-10 w-10 shrink-0"
            description={day.description}
            icon={day.icon}
          />
          <span>{day.description}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-sm font-bold sm:text-base">
        <span>♨ {Math.round(day.tempMax)} °{unitLabel}</span>
        <span>☁ {day.rainChance} %</span>
        <span>≋ {day.wind} {unitLabel === "C" ? "m/s" : "mph"}</span>
        <span>♒ {day.humidity} %</span>
      </div>
    </article>
  );
}
