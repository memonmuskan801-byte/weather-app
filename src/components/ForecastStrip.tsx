import type { DailyForecast } from "../types/weather";

export default function ForecastStrip({
  days,
  isDark,
  unitLabel,
}: {
  days: DailyForecast[];
  isDark: boolean;
  unitLabel: "C" | "F";
}) {
  if (days.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border p-5 shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-in-out sm:p-6 ${
        isDark
          ? "border-white/10 bg-white/[0.07] shadow-sky-500/10"
          : "border-white/80 bg-white/75 shadow-sky-200/60"
      }`}
    >
      <div className="mb-5">
        <p className={isDark ? "text-sm font-semibold text-sky-200" : "text-sm font-semibold text-sky-600"}>
          Next 5 days
        </p>
        <h3 className="mt-1 text-2xl font-bold">Forecast</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {days.map((day) => (
          <article
            className={`rounded-2xl border p-4 transition-all duration-300 ease-in-out hover:-translate-y-1 ${
              isDark
                ? "border-white/10 bg-white/[0.06] hover:bg-white/[0.09]"
                : "border-sky-100 bg-white/70 hover:bg-white"
            }`}
            key={day.date}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{day.dayLabel}</p>
                <p className={isDark ? "mt-1 text-xs capitalize text-slate-400" : "mt-1 text-xs capitalize text-slate-500"}>
                  {day.description}
                </p>
              </div>
              <img
                alt={day.description}
                className="h-12 w-12"
                src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
              />
            </div>

            <p className="mt-4 text-2xl font-bold">
              {Math.round(day.tempMax)}&deg;
              <span className={isDark ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
                {" "}
                / {Math.round(day.tempMin)}&deg;{unitLabel}
              </span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold">
              <span className={isDark ? "rounded-xl bg-white/5 px-3 py-2 text-slate-300" : "rounded-xl bg-sky-50 px-3 py-2 text-slate-600"}>
                Rain {day.rainChance}%
              </span>
              <span className={isDark ? "rounded-xl bg-white/5 px-3 py-2 text-slate-300" : "rounded-xl bg-sky-50 px-3 py-2 text-slate-600"}>
                Hum {day.humidity}%
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
