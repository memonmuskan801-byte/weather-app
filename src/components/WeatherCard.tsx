import type { WeatherType } from "../types/weather";

const formatTime = (timestamp?: number, timezone = 0) => {
  if (!timestamp) return "--";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date((timestamp + timezone) * 1000));
};

const windLabel = (speed: number, unitLabel: "C" | "F") =>
  `${Math.round(speed)} ${unitLabel === "C" ? "m/s" : "mph"}`;

export default function WeatherCard({
  data,
  isDark,
  placeLabel,
  unitLabel,
}: {
  data: WeatherType;
  isDark: boolean;
  placeLabel: string;
  unitLabel: "C" | "F";
}) {
  const condition = data.weather[0];
  const iconUrl = condition
    ? `https://openweathermap.org/img/wn/${condition.icon}@4x.png`
    : "";

  return (
    <section
      className={`weather-float overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-in-out ${
        isDark
          ? "border-white/10 bg-white/[0.07] shadow-sky-500/10"
          : "border-white/80 bg-white/75 shadow-sky-200/60"
      }`}
    >
      <div className="relative p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={isDark ? "text-sm font-semibold text-sky-200" : "text-sm font-semibold text-sky-600"}>
                  Current weather
                </p>
                <h2 className="mt-2 truncate text-3xl font-bold tracking-tight sm:text-5xl">
                  {placeLabel || data.name}
                </h2>
                <p className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-500"}>
                  Updated {formatTime(data.dt, data.timezone)}
                </p>
              </div>

              {iconUrl && (
                <img
                  alt={condition.description}
                  className="h-24 w-24 shrink-0 drop-shadow-xl"
                  src={iconUrl}
                />
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-end gap-4">
              <p className="text-7xl font-bold leading-none tracking-tight sm:text-8xl">
                {Math.round(data.main.temp)}
                <span className="align-top text-3xl">&deg;{unitLabel}</span>
              </p>
              <div className="pb-2">
                <p className="text-xl font-semibold capitalize">
                  {condition.description}
                </p>
                <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-500"}>
                  Feels like {Math.round(data.main.feels_like)}&deg;{unitLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric
              isDark={isDark}
              label="High / Low"
              value={`${Math.round(data.main.temp_max)}&deg; / ${Math.round(data.main.temp_min)}&deg;`}
            />
            <Metric isDark={isDark} label="Humidity" value={`${data.main.humidity}%`} />
            <Metric isDark={isDark} label="Wind" value={windLabel(data.wind.speed, unitLabel)} />
            <Metric isDark={isDark} label="Pressure" value={`${data.main.pressure} hPa`} />
            <Metric
              isDark={isDark}
              label="Sunrise"
              value={formatTime(data.sys?.sunrise, data.timezone)}
            />
            <Metric
              isDark={isDark}
              label="Sunset"
              value={formatTime(data.sys?.sunset, data.timezone)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  isDark,
  label,
  value,
}: {
  isDark: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-300 ease-in-out hover:scale-[1.02] ${
        isDark
          ? "border-white/10 bg-white/[0.06]"
          : "border-sky-100 bg-white/70"
      }`}
    >
      <p className={isDark ? "text-xs font-semibold text-slate-400" : "text-xs font-semibold text-slate-500"}>
        {label}
      </p>
      <p
        className="mt-2 text-lg font-bold"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}
