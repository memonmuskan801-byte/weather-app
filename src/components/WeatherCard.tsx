import type { WeatherType } from "../types/weather";

const titleCase = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
};

export default function WeatherCard({ data }: { data: WeatherType }) {
  return (
    <div className="mt-6 bg-white/60 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-lg transition-all font-semibold">
      {/* City */}
      <h2 className="text-2xl font-extrabold text-gray-800 text-center">
        {titleCase(data.name)}
      </h2>

      {/* Temperature */}
      <p className="text-5xl font-bold text-center mt-2 text-blue-600">
        {Math.round(data.main.temp)}°C
      </p>

      {/* Condition */}
      <p className="text-center text-gray-800 capitalize mt-1 text-lg font-semibold">
        {data.weather[0].description}
      </p>

      {/* Divider */}
      <div className="h-px bg-white/40 my-4"></div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-base font-semibold text-gray-700">
        <div className="bg-white/50 p-3 rounded-xl text-center">
          💧 Humidity<br />
          <b>{data.main.humidity}%</b>
        </div>

        <div className="bg-white/50 p-3 rounded-xl text-center">
          🌬️ Wind<br />
          <b>{data.wind.speed} m/s</b>
        </div>

        <div className="bg-white/50 p-3 rounded-xl text-center col-span-2">
          🤍 Feels Like<br />
          <b>{Math.round(data.main.feels_like)}°C</b>
        </div>
      </div>
    </div>
  );
}

