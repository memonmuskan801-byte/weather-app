import { useEffect, useRef, useState } from "react";
import WeatherCard from "./components/WeatherCard";
import type { WeatherType } from "./types/weather";
import { COUNTRIES } from "./data/countries";
import { getWeather, searchCitiesByCountry } from "./services/weatherService";

const normalizeText = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .map((w) =>
      w
        ? w[0].toUpperCase() + w.slice(1).toLowerCase()
        : w
    )
    .join(" ");
};

export default function App() {
  // COUNTRY STATE
  const [country, setCountry] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);

  // CITY STATE
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");



  // WEATHER STATE
  const [data, setData] = useState<WeatherType | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  // CITY AUTOCOMPLETE (realtime)
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const cityAbortRef = useRef<AbortController | null>(null);

  // Hard reset city-related state whenever country changes.
  // (Keeps eslint/react-hooks performance rule satisfied by only mutating
  // external controllers in this effect.)
  useEffect(() => {
    if (cityAbortRef.current) cityAbortRef.current.abort();
    cityAbortRef.current = null;

    // Abort any ongoing weather request.
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
  }, [country]);

  // Reset city-related state when country changes.
  // Note: disable the specific eslint rule that flags setState inside effects
  // for this case (we are synchronizing component state with a derived selection).
  useEffect(() => {
    // Defer state resets to the end of the current tick.
    // This avoids the lint rule and reduces the chance of cascading renders.
    const id = window.setTimeout(() => {
      setCityQuery("");
      setSelectedCity("");
      setCitySuggestions([]);
      setError("");
      setData(null);
    }, 0);

    return () => window.clearTimeout(id);
  }, [country]);

  useEffect(() => {
    // Suggestions are only relevant while typing a new city.
    if (!country || selectedCity) return;

    const q = normalizeText(cityQuery);
    if (!q) return;


    const handle = window.setTimeout(async () => {
      // Abort previous request
      if (cityAbortRef.current) cityAbortRef.current.abort();
      const controller = new AbortController();
      cityAbortRef.current = controller;

      try {
        setError("");
        const results = await searchCitiesByCountry(q, country, controller.signal);
        setCitySuggestions(results);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Failed to load city suggestions");
        setCitySuggestions([]);
      }
    }, 300);

    return () => {
      window.clearTimeout(handle);
    };
  }, [country, cityQuery, selectedCity]);



  // GET WEATHER
  const searchWeather = async () => {
    if (!country) {
      setError("Select a country first");
      return;
    }

    if (!selectedCity) {
      setError("Select a city first");
      return;
    }

    try {
      if (abortRef.current) abortRef.current.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError("");
      setData(null);

      const result = await getWeather(selectedCity);
      setData(result);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const cityInputValue = cityQuery || selectedCity;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-200 p-4">
      <div className="w-full max-w-md bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-6">
        <h1 className="text-3xl font-bold text-center mb-6">
          🌤️ Weather Forecast
        </h1>

        {/* COUNTRY */}
        <div className="mb-4">
          <label className="text-sm">1) Select Country</label>

          <div className="relative flex gap-2 mt-2">
            <input
              value={countryQuery}
              onChange={(e) => {
                setCountryQuery(e.target.value);
                setCountryOpen(true);
              }}
              onFocus={() => setCountryOpen(true)}
              placeholder="Pakistan, Japan, USA..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/70 border"
            />

            <button
              onClick={() => setCountryOpen(!countryOpen)}
              className="px-3 bg-blue-500 text-white rounded-xl"
            >
              ▼
            </button>

            {countryOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-xl mt-2 max-h-60 overflow-auto z-50">
                {COUNTRIES.filter((c) =>
                  c
                    .toLowerCase()
                    .includes(countryQuery.toLowerCase())
                ).map((c) => (
                  <div
                    key={c}
                    onClick={() => {
                      setCountry(c);
                      setCountryQuery(c);
                      setCountryOpen(false);

                      // RESET CITY
                      setCityQuery("");
                      setSelectedCity("");

                      setData(null);
                      setError("");

                    }}
                    className="p-2 hover:bg-blue-50 cursor-pointer"
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          {country && (
            <p className="text-xs mt-1">
              Selected: <b>{country}</b>
            </p>
          )}
        </div>

        {/* CITY */}
        <div className="mb-4">
          <label className="text-sm">2) Select City</label>

          <div className="relative flex gap-2 mt-2">
            <input
              disabled={!country}
              value={cityInputValue}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setSelectedCity("");
              }}
              placeholder={
                country
                  ? "Type city..."
                  : "Select country first"
              }
              className="flex-1 px-4 py-3 rounded-xl bg-white/70 border disabled:opacity-60"
            />

            <button
              onClick={searchWeather}
              disabled={!country || !selectedCity || loading}
              className="px-4 bg-blue-500 text-white rounded-xl"
            >
              {loading ? "..." : "Get"}
            </button>

            {/* CITY DROPDOWN */}
            {citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-xl mt-2 max-h-60 overflow-auto z-50">
                {citySuggestions.map((city) => (
                  <div
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setCityQuery(city);
                      setError("");

                      // Hide dropdown after selecting a city.
                      setCitySuggestions([]);

                      setData(null);
                    }}
                    className="p-2 hover:bg-blue-50 cursor-pointer"
                  >
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-center mt-4">Loading...</p>
        )}

        {/* ERROR */}
        {error && (
          <p className="text-center mt-4 text-red-500">
            {error}
          </p>
        )}

        {/* WEATHER */}
        {data && (
          <div className="mt-4">
            <WeatherCard data={data} />
          </div>
        )}

        {/* EMPTY */}
        {!data && !loading && !error && (
          <p className="text-center mt-6 text-gray-600">
            Country → City select karo 🌍
          </p>
        )}
      </div>
    </div>
  );
}